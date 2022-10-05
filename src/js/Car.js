import {
	Axis,
	Color3, Color4,
	CreateBoxVertexData,
	CreateCylinderVertexData, HingeJoint,
	Mesh, MeshBuilder, PhysicsImpostor, Quaternion, Space, StandardMaterial, Texture,
	Vector3
} from "@babylonjs/core";

const wheels = [
	{ name: 'driverFront', offset: new Vector3(-3, 0, -3), left: true },
	{ name: 'driverRear', offset: new Vector3(3, 0, -3), left: true },
	{ name: 'passengerFront', offset: new Vector3(-3, 0, 3), left: false },
	{ name: 'passengerRear', offset: new Vector3(3, 0, 3), left: false }
];

export default class Car {

	#wheels = [];

	constructor() {}

	build (args = {}) {
		const { scene, position } = args;
		const bodyPosition = position.clone();
		const chassis = this.#addChassis({ name: 'mikey', position: bodyPosition, scene });
		const wheelPosition = position.clone();
		wheelPosition.addInPlace(wheels[0].offset);
		const wheel = this.#addWheel({ name: wheels[0].name, scene, position: wheelPosition, left: wheels[0].left });


/*		chassis.addChild(wheel.axel);
		chassis.addChild(wheel.wheel);*/
/*
		wheels.forEach((wheel) => {
			const wheelPosition = position.clone();
			wheelPosition.addInPlace(wheel.offset);
			this.#wheels.push(this.#addWheel({ name: wheel.name, scene, position: wheelPosition, left: wheel.left }));
		});
*/

	}

	#addChassis(args = {}) {
		const { name, scene, position } = args;
		const chassisPosition = position.clone();
		const color = new Color4(0, 1, 0, 1);
		const faceColors = [color, color, color, color, color, color];
		const chassis = MeshBuilder.CreateBox(`${name}-chassis`, { width: 4, height: 1, depth: 2, faceColors }, scene);
		chassis.position = chassisPosition;
		chassis.physicsImpostor = new PhysicsImpostor(chassis, PhysicsImpostor.BoxImpostor, { mass: 1 });
		return chassis;
	}

	#addWheel(args = {}) {
		const { name, scene, position, left } = args;
		const axel = MeshBuilder.CreateCylinder(`${name}-axel`, {diameter: .5, height:1}, scene);
		axel.material = new StandardMaterial("", scene);
		axel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		axel.rotation.x = Math.PI / 2;
		axel.position = position.clone();

		const wheel = MeshBuilder.CreateCylinder(`${name}-wheel`, {diameter: 2, height:.5}, scene);
		wheel.material = new StandardMaterial("wheelMat", scene);
		wheel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		// wheel.position.z -= .5 * (left ? -1 : 1);

		wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, {mass: 10});
		axel.physicsImpostor = new PhysicsImpostor(axel, PhysicsImpostor.CylinderImpostor, {mass: 1});

		const joint1 = new HingeJoint({
			mainPivot: new Vector3(0, .5 * (left ? -1 : 1), 0),
			// mainPivot: new Vector3(0, 0, 0),
			connectedPivot: new Vector3(0, 0, 0),
			mainAxis: new Vector3(0, 1, 0),
			connectedAxis: new Vector3(0, 0, 0),
			nativeParams: {}
		});
		axel.physicsImpostor.addJoint(wheel.physicsImpostor, joint1);
		console.log(axel.physicsImpostor);
		return { wheel, axel };
	}
}

/*
export default class Car {

	// Inspiration: https://playground.babylonjs.com/#609QKP#2
	#vehicleReady = false;
	#ZERO_QUATERNION = new Quaternion();

	#chassisWidth = 1.8;
	#chassisHeight = .6;
	#chassisLength = 4;
	#massVehicle = 200;

	// axis definitions
	#wheelAxisPositionBack = -1;
	#wheelRadiusBack = .4;
	#wheelWidthBack = .3;
	#wheelHalfTrackBack = 1;
	#wheelAxisHeightBack = 0.4;

	#wheelAxisFrontPosition = 1.0;
	#wheelHalfTrackFront = 1;
	#wheelAxisHeightFront = 0.4;
	#wheelRadiusFront = .4;
	#wheelWidthFront = .3;

	#friction = 5;
	#suspensionStiffness = 10;
	#suspensionDamping = 0.3;
	#suspensionCompression = 4.4;
	#suspensionRestLength = 0.6;
	#rollInfluence = 0.0;
	#tuning;

	// No steering, no acceleration, no breaking
	// #steeringIncrement = .01;
	// #steeringClamp = 0.2;
	// #maxEngineForce = 500;
	// #maxBreakingForce = 10;
	// #incEngine = 10.0;

	#FRONT_LEFT = 0;
	#FRONT_RIGHT = 1;
	#BACK_LEFT = 2;
	#BACK_RIGHT = 3;

	#wheelDirectionCS0;
	#wheelAxleCS;

	#chassisMesh;
	#vehicle;
	#wheelMeshes = [];

	#greenMaterial;
	#blackMaterial;

	#scene;

	constructor(args) {
		const { Ammo, scene } = args;
		this.#wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
		this.#wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
		this.#scene = scene;
		this.#greenMaterial = new StandardMaterial("GreenMaterial", scene);
		this.#greenMaterial.diffuseColor = new Color3(0.5, 0.8, 0.5);
		this.#greenMaterial.emissiveColor = new Color3(0.5, 0.8, 0.5);

		this.#blackMaterial = new StandardMaterial("BlackMaterial", scene);
		this.#blackMaterial.diffuseColor = new Color3(0.1,0.1,0.1);
		this.#blackMaterial.emissiveColor = new Color3(0.1,0.1,0.1);
		this.#blackMaterial.wireframe = true;
	}

	build(args) {
		const { scene, Ammo, position } = args;
		const quaternion = this.#ZERO_QUATERNION;
		this.#createBody({ Ammo, scene, position, quaternion });
		this.#chassisMesh.position = position;
	}

	#createBody(args) {
		const { Ammo, scene, position, quaternion } = args;
		const physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
		const geometry = new Ammo.btBoxShape(new Ammo.btVector3(this.#chassisWidth * .5, this.#chassisHeight * .5, this.#chassisLength * .5));
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(0,5,0));
		transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
		const motionState = new Ammo.btDefaultMotionState(transform);
		const localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(this.#massVehicle, localInertia);

		this.#chassisMesh = this.#createChassisMesh({
			scene,
			width: this.#chassisWidth,
			depth: this.#chassisLength,
			height: this.#chassisHeight
		});

		const massOffset = new Ammo.btVector3( 0, 0.4, 0);
		const transform2 = new Ammo.btTransform();
		transform2.setIdentity();
		transform2.setOrigin(massOffset);
		const compound = new Ammo.btCompoundShape();
		compound.addChildShape( transform2, geometry );

		const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(this.#massVehicle, motionState, compound, localInertia));
		body.setActivationState(4);

		physicsWorld.addRigidBody(body);

		// TODO: Not sure if we need the following
		const engineForce = 0;
		const vehicleSteering = 0;
		const breakingForce = 0;
		this.#tuning = new Ammo.btVehicleTuning();
		const rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
		this.#vehicle = new Ammo.btRaycastVehicle(this.#tuning, body, rayCaster);
		this.#vehicle.setCoordinateSystem(0, 1, 2);
		physicsWorld.addAction(this.#vehicle);

		const trans = this.#vehicle.getChassisWorldTransform();

		this.#addWheel(scene, true, new Ammo.btVector3(this.#wheelHalfTrackFront, this.#wheelAxisHeightFront, this.#wheelAxisFrontPosition), this.#wheelRadiusFront, this.#wheelWidthFront, this.#FRONT_LEFT);
		this.#addWheel(scene, true, new Ammo.btVector3(-this.#wheelHalfTrackFront, this.#wheelAxisHeightFront, this.#wheelAxisFrontPosition), this.#wheelRadiusFront, this.#wheelWidthFront, this.#FRONT_RIGHT);
		this.#addWheel(scene, false, new Ammo.btVector3(-this.#wheelHalfTrackBack, this.#wheelAxisHeightBack, this.#wheelAxisPositionBack), this.#wheelRadiusBack, this.#wheelWidthBack, this.#BACK_LEFT);
		this.#addWheel(scene, false, new Ammo.btVector3(this.#wheelHalfTrackBack, this.#wheelAxisHeightBack, this.#wheelAxisPositionBack), this.#wheelRadiusBack, this.#wheelWidthBack, this.#BACK_RIGHT);

		this.#vehicleReady = true;
	}

	#addWheel(scene, isFront, position, radius, width, index) {
		const wheelInfo = this.#vehicle.addWheel(
			position,
			this.#wheelDirectionCS0,
			this.#wheelAxleCS,
			this.#suspensionRestLength,
			radius,
			this.#tuning,
			isFront
		);
		wheelInfo.set_m_suspensionStiffness(this.#suspensionStiffness);
		wheelInfo.set_m_wheelsDampingRelaxation(this.#suspensionDamping);
		wheelInfo.set_m_wheelsDampingCompression(this.#suspensionCompression);
		wheelInfo.set_m_maxSuspensionForce(600000);
		wheelInfo.set_m_frictionSlip(40);
		wheelInfo.set_m_rollInfluence(this.#rollInfluence);

		this.#wheelMeshes[index] = this.#createWheelMesh({ scene, radius, width });
	}

	#createChassisMesh(args) {
		// depth = length
		const { scene, width, height, depth } = args;
		const mesh = new MeshBuilder.CreateBox("box", { width, depth, height }, scene);
		mesh.rotationQuaternion = new Quaternion();
		mesh.material = this.#greenMaterial;

		/!*var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
		camera.radius = 10;
		camera.heightOffset = 4;
		camera.rotationOffset = 0;
		camera.cameraAcceleration = 0.05;
		camera.maxCameraSpeed = 400;
		camera.attachControl(canvas, true);
		camera.lockedTarget = mesh; //version 2.5 onwards
		scene.activeCamera = camera;*!/

		return mesh;
	}

	#createWheelMesh(args) {
		const { scene, radius, width } = args;
		const mesh = new MeshBuilder.CreateCylinder("Wheel", { diameter:1, height:0.5, tessellation: 6 }, scene);
		mesh.rotationQuaternion = new Quaternion();
		mesh.material = this.#blackMaterial;
		return mesh;
	}

}

*/



	/*	#body;
	#roof;
	#wheels;
	#id;
	#color;
	#vertexData;
	#physicsAnchor;
	#wheelPositions = {
		driverFront: [-.65, -2.2, -.5],
		driverRear: [.65, -2.2, -.5],
		passengerFront: [-.65, -2.2, .5],
		passengerRear: [.65, -2.2, .5]
	}
	#wheelNames = ['driverFront', 'driverRear', 'passengerFront', 'passengerRear'];

	constructor(args) {
		const { id, color } = args;
		this.#id = id;
		this.#color = color;
		this.#wheels = {};
		this.#vertexData = {
			body: null,
			wheels: {}
		};
		this.#wheelNames.forEach((wheelName) => {
			this.#wheels[wheelName] = null;
			this.#vertexData.wheels[wheelName] = null;
		});
		this.#initialize();
	}

	get velocity () {
		const { x, y, z } = this.#physicsAnchor.physicsImpostor.getLinearVelocity();
		return Math.abs(x + y + z);
	}

	turnTires () {
		if (this.velocity > 0.5) {
			this.#wheelNames.forEach((wheelName) => {
				this.#wheels[wheelName].rotate(Axis.Y, -.5, Space.LOCAL);
			});
		}
	}

	#initialize() {
		const color = this.#color.toColor4(1);
		this.#vertexData.body = CreateBoxVertexData({
			height: .5,
			width: 2,
			depth: 1,
			faceColors: [color, color, color, color, color, color]
		});
		const black = Color3.Black().toColor4(1);
		this.#wheelNames.forEach((wheelName) => {
			this.#vertexData.wheels[wheelName] = CreateCylinderVertexData({
				height: .15,
				diameter: .5,
				faceColors: [black, black, black]
			});
		});
	}

	#positionWheel(args) {
		const { wheelName, scene, position } = args;
		const [ x, y, z ] = this.#wheelPositions[wheelName];
		const wheel = new Mesh(`${this.#id}-wheel-${wheelName}`, scene, this.#body);
		const tire = new StandardMaterial(`${this.#id}-tire-mat`, scene);
		tire.wireframe = true;
		wheel.position = position.clone();
		wheel.position.y += y;
		wheel.position.z += z;
		wheel.position.x += x;
		wheel.rotation.x = Math.PI / 2;
		wheel.material = tire;
		return wheel;
	}

	build (args) {
		const { scene = null, position = new Vector3(0, 0, 0) } = args;
		this.#body = new Mesh(`${this.#id}-body`);
		this.#vertexData.body.applyToMesh(this.#body, scene);
		this.#body.position = position;
		this.#body.physicsImpostor = new PhysicsImpostor(this.#body, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene );

		this.#wheelNames.forEach((wheelName) => {
			const wheel = this.#positionWheel({ wheelName, scene, position });
			this.#vertexData.wheels[wheelName].applyToMesh(wheel, scene);
			wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: 0 }, scene);
			this.#wheels[wheelName] = wheel;
		});

		this.#physicsAnchor = new Mesh(`${this.#id}-physics-anchor`, scene);
		this.#physicsAnchor.addChild(this.#body);
		this.#physicsAnchor.physicsImpostor = new PhysicsImpostor(this.#physicsAnchor, PhysicsImpostor.NoImpostor, { mass: 3, friction: 0 }, scene);

		this.#physicsAnchor.rotation.x = Math.PI / 2;
	}

	junk(scene) {
		scene.removeMesh(this.#physicsAnchor);
		scene.removeMesh(this.#body);
		this.#wheelNames.forEach((wheelName) => {
			scene.removeMesh(this.#wheels[wheelName]);
		});
	}*/



/*
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

        <title>Babylon.js sample code</title>

        <!-- Babylon.js -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.2/dat.gui.min.js"></script>
        <script src="https://assets.babylonjs.com/generated/Assets.js"></script>
        <script src="https://preview.babylonjs.com/ammo.js"></script>
        <script src="https://preview.babylonjs.com/cannon.js"></script>
        <script src="https://preview.babylonjs.com/Oimo.js"></script>
        <script src="https://preview.babylonjs.com/earcut.min.js"></script>
        <script src="https://preview.babylonjs.com/babylon.js"></script>
        <script src="https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js"></script>
        <script src="https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js"></script>
        <script src="https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js"></script>
        <script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.js"></script>
        <script src="https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js"></script>
        <script src="https://preview.babylonjs.com/gui/babylon.gui.min.js"></script>
        <script src="https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js"></script>

        <style>
            html, body {
                overflow: hidden;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }

            #renderCanvas {
                width: 100%;
                height: 100%;
                touch-action: none;
            }
        </style>
    </head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script>
        var canvas = document.getElementById("renderCanvas");

        var startRenderLoop = function (engine, canvas) {
            engine.runRenderLoop(function () {
                if (sceneToRender && sceneToRender.activeCamera) {
                    sceneToRender.render();
                }
            });
        }

        var engine = null;
        var scene = null;
        var sceneToRender = null;
        var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
        var vehicle, scene, chassisMesh, redMaterial, blueMaterial, greenMaterial, blackMaterial;
        var wheelMeshes = [];
        var actions = {accelerate:false,brake:false,right:false,left:false};

        var keysActions = {
        	"KeyW":'acceleration',
        	"KeyS":'braking',
        	"KeyA":'left',
        	"KeyD":'right'
        };

        var vehicleReady = false;

        var ZERO_QUATERNION = new BABYLON.Quaternion();

        var chassisWidth = 1.8;
        var chassisHeight = .6;
        var chassisLength = 4;
        var massVehicle = 200;

        var wheelAxisPositionBack = -1;
        var wheelRadiusBack = .4;
        var wheelWidthBack = .3;
        var wheelHalfTrackBack = 1;
        var wheelAxisHeightBack = 0.4;

        var wheelAxisFrontPosition = 1.0;
        var wheelHalfTrackFront = 1;
        var wheelAxisHeightFront = 0.4;
        var wheelRadiusFront = .4;
        var wheelWidthFront = .3;

        var friction = 5;
        var suspensionStiffness = 10;
        var suspensionDamping = 0.3;
        var suspensionCompression = 4.4;
        var suspensionRestLength = 0.6;
        var rollInfluence = 0.0;

        var steeringIncrement = .01;
        var steeringClamp = 0.2;
        var maxEngineForce = 500;
        var maxBreakingForce = 10;
        var incEngine = 10.0;

        var FRONT_LEFT = 0;
        var FRONT_RIGHT = 1;
        var BACK_LEFT = 2;
        var BACK_RIGHT = 3;

        var wheelDirectionCS0;
        var wheelAxleCS;


        var createScene = async function () {


            // Setup basic scene
            scene = new BABYLON.Scene(engine);
            var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(canvas, true);
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            redMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
            redMaterial.diffuseColor = new BABYLON.Color3(0.8,0.4,0.5);
            redMaterial.emissiveColor = new BABYLON.Color3(0.8,0.4,0.5);

            blueMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
            blueMaterial.diffuseColor = new BABYLON.Color3(0.5,0.4,0.8);
            blueMaterial.emissiveColor = new BABYLON.Color3(0.5,0.4,0.8);

            greenMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
            greenMaterial.diffuseColor = new BABYLON.Color3(0.5,0.8,0.5);
            greenMaterial.emissiveColor = new BABYLON.Color3(0.5,0.8,0.5);

            blackMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
            blackMaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.1);
            blackMaterial.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1);
            // Enable physics
            scene.enablePhysics(new BABYLON.Vector3(0,-10,0), new BABYLON.AmmoJSPlugin());

            wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
            wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

            var ground = BABYLON.Mesh.CreateGround("ground", 460, 460, 2, scene);
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, scene);
            ground.material = new BABYLON.GridMaterial("groundMaterial", scene);



            createBox(new BABYLON.Vector3(4,1,12),new BABYLON.Vector3(0,0,25),new BABYLON.Vector3(-Math.PI/8,0,0),0);
            createBox(new BABYLON.Vector3(4,1,12),new BABYLON.Vector3(25,0,0),new BABYLON.Vector3(-Math.PI/8,Math.PI/2,0),0);
            createBox(new BABYLON.Vector3(4,1,12),new BABYLON.Vector3(0,0,-25),new BABYLON.Vector3(Math.PI/8,0,0),0);
            createBox(new BABYLON.Vector3(4,1,12),new BABYLON.Vector3(-25,0,0),new BABYLON.Vector3(Math.PI/8,Math.PI/2,0),0);

            let s = new BABYLON.Vector3();
            let p = new BABYLON.Vector3();
            let r = new BABYLON.Vector3();
            for(let i=0;i<20;i++){
                let m = Math.random()*300-150+5;
                let m3 = Math.random()*300-150+5;
                let m2 = Math.random()*10;
                s.set(m2,m2,m2);
                p.set(m3,0,m);
                r.set(m,m,m);
                createBox(s,p,r,0);
            }

            for(let i=0;i<30;i++){
                let m = Math.random()*300-150+5;
                let m3 = Math.random()*300-150+5;
                let m2 = Math.random()*3;
                s.set(m2,m2,m2);
                p.set(m3,0,m);
                r.set(m,m,m);
                createBox(s,p,r,5);
            }

            loadTriangleMesh();

            createVehicle(new BABYLON.Vector3(0, 4, -20), ZERO_QUATERNION);

            window.addEventListener( 'keydown', keydown);
        	window.addEventListener( 'keyup', keyup);

            scene.registerBeforeRender(function(){

                var dt = engine.getDeltaTime().toFixed()/1000;

                if(vehicleReady){

                    var speed = vehicle.getCurrentSpeedKmHour();
                    var maxSteerVal = 0.2;
                    breakingForce = 0;
        			engineForce = 0;


        			if(actions.acceleration){
        				if (speed < -1){
        					breakingForce = maxBreakingForce;
        				}else {
        					engineForce = maxEngineForce;
        			    }

        			} else if(actions.braking){
        				if (speed > 1){
        					breakingForce = maxBreakingForce;
        				}else {
        					engineForce = -maxEngineForce ;
        				}
        			}

        			if(actions.right){
        				if (vehicleSteering < steeringClamp){
        					vehicleSteering += steeringIncrement;
        				}

        			} else if(actions.left){
        				if (vehicleSteering > -steeringClamp){
        					vehicleSteering -= steeringIncrement;
        				}

        			} else {
        				vehicleSteering = 0;
        			}

        			vehicle.applyEngineForce(engineForce, FRONT_LEFT);
        			vehicle.applyEngineForce(engineForce, FRONT_RIGHT);

        			vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
        			vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
        			vehicle.setBrake(breakingForce, BACK_LEFT);
        			vehicle.setBrake(breakingForce, BACK_RIGHT);

        			vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
        			vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);


        			var tm, p, q, i;
        			var n = vehicle.getNumWheels();
        			for (i = 0; i < n; i++) {
        				vehicle.updateWheelTransform(i, true);
        				tm = vehicle.getWheelTransformWS(i);
        				p = tm.getOrigin();
        				q = tm.getRotation();
        				wheelMeshes[i].position.set(p.x(), p.y(), p.z());
        				wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                        wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI/2);
        			}

        			tm = vehicle.getChassisWorldTransform();
        			p = tm.getOrigin();
        			q = tm.getRotation();
        			chassisMesh.position.set(p.x(), p.y(), p.z());
        			chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        			chassisMesh.rotate(BABYLON.Axis.X, Math.PI);

                }



            });

            return scene;
        };


        function loadTriangleMesh(){
            var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
            BABYLON.SceneLoader.ImportMesh("Loft001", "https://raw.githubusercontent.com/RaggarDK/Baby/baby/", "ramp.babylon", scene, function (newMeshes) {
                for(let x=0;x<newMeshes.length;x++){
                    let mesh = newMeshes[x];
        			mesh.position.y -= 2.5;
                    mesh.material = redMaterial;
        			let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        			let normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        			let colors = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
        			let uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
        			let indices = mesh.getIndices();

        			mesh.updateFacetData();
        			var localPositions = mesh.getFacetLocalPositions();
        			var triangleCount = localPositions.length;

        			let mTriMesh = new Ammo.btTriangleMesh();
        			let removeDuplicateVertices = true;
        			let tmpPos1 = new Ammo.btVector3(0,0,0);
        			let tmpPos2 = new Ammo.btVector3(0,0,0);
        			let tmpPos3 = new Ammo.btVector3(0,0,0);

        			var _g = 0;
        			while(_g < triangleCount) {
        				var i = _g++;
        				var index0 = indices[i * 3];
        				var index1 = indices[i * 3 + 1];
        				var index2 = indices[i * 3 + 2];
        				var vertex0 = new Ammo.btVector3(positions[index0 * 3],positions[index0 * 3 + 1],positions[index0 * 3 + 2]);
        				var vertex1 = new Ammo.btVector3(positions[index1 * 3],positions[index1 * 3 + 1],positions[index1 * 3 + 2]);
        				var vertex2 = new Ammo.btVector3(positions[index2 * 3],positions[index2 * 3 + 1],positions[index2 * 3 + 2]);
        				mTriMesh.addTriangle(vertex0,vertex1,vertex2);
        			}

        			let shape = new Ammo.btBvhTriangleMeshShape( mTriMesh, true, true );
        			let localInertia = new Ammo.btVector3(0, 0, 0);
                    let transform = new Ammo.btTransform;

        			transform.setIdentity();
                    transform.setOrigin(new Ammo.btVector3(mesh.position.x,mesh.position.y,mesh.position.z));
                    transform.setRotation(new Ammo.btQuaternion(
                    mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w));

                    let motionState = new Ammo.btDefaultMotionState(transform);
                    let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
                    let body = new Ammo.btRigidBody(rbInfo);
                    physicsWorld.addRigidBody(body);
                }

            });

        }

        function createBox(size, position, rotation, mass){

            var box = new BABYLON.MeshBuilder.CreateBox("box", {width:size.x, depth:size.z, height:size.y}, scene);
            box.position.set(position.x,position.y,position.z);
            box.rotation.set(rotation.x,rotation.y,rotation.z);
            if(!mass){
                mass = 0;
                box.material = redMaterial;
            } else {
                box.position.y += 5;
                box.material = blueMaterial;

            }
            box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, friction: 0.5, restitution: 0.7 }, scene);

        }


        function createVehicle(pos, quat) {
        //Going Native
        var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;

        var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0,5,0));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        var motionState = new Ammo.btDefaultMotionState(transform);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        geometry.calculateLocalInertia(massVehicle, localInertia);

        chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

        var massOffset = new Ammo.btVector3( 0, 0.4, 0);
        var transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        transform2.setOrigin(massOffset);
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape( transform2, geometry );

        var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, compound, localInertia));
        body.setActivationState(4);

        physicsWorld.addRigidBody(body);

        var engineForce = 0;
        var vehicleSteering = 0;
        var breakingForce = 0;
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
        vehicle.setCoordinateSystem(0, 1, 2);
        physicsWorld.addAction(vehicle);

        var trans = vehicle.getChassisWorldTransform();



            function addWheel(isFront, pos, radius, width, index) {


        		var wheelInfo = vehicle.addWheel(
        			pos,
        			wheelDirectionCS0,
        			wheelAxleCS,
        			suspensionRestLength,
        			radius,
        			tuning,
        			isFront);

        		wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
        		wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
        		wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
        		wheelInfo.set_m_maxSuspensionForce(600000);
        		wheelInfo.set_m_frictionSlip(40);
        		wheelInfo.set_m_rollInfluence(rollInfluence);

        		wheelMeshes[index] = createWheelMesh(radius, width);
        	}

            addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
        	addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
        	addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
        	addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

            vehicleReady = true;
        }


        function createChassisMesh(w, l, h) {

        	var mesh = new BABYLON.MeshBuilder.CreateBox("box", {width:w, depth:h, height:l}, scene);
        	mesh.rotationQuaternion = new BABYLON.Quaternion();
        	mesh.material = greenMaterial;

        	var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
            camera.radius = 10;
            camera.heightOffset = 4;
            camera.rotationOffset = 0;
            camera.cameraAcceleration = 0.05;
            camera.maxCameraSpeed = 400;
            camera.attachControl(canvas, true);
            camera.lockedTarget = mesh; //version 2.5 onwards
            scene.activeCamera = camera;

            return mesh;
        }


        function createWheelMesh(radius, width) {
        	//var mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
            var mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", {diameter:1, height:0.5, tessellation: 6}, scene);
        	mesh.rotationQuaternion = new BABYLON.Quaternion();
            mesh.material = blackMaterial;

        	return mesh;
        }


        function keyup(e) {
        	if(keysActions[e.code]) {
        		actions[keysActions[e.code]] = false;
        		//e.preventDefault();
        		//e.stopPropagation();

        		//return false;
        	}
        }

        function keydown(e) {
        	if(keysActions[e.code]) {
        		actions[keysActions[e.code]] = true;
        		//e.preventDefault();
        		//e.stopPropagation();

        		//return false;
        	}
        }

                window.initFunction = async function() {
                    await Ammo();

                    var asyncEngineCreation = async function() {
                        try {
                        return createDefaultEngine();
                        } catch(e) {
                        console.log("the available createEngine function failed. Creating the default engine instead");
                        return createDefaultEngine();
                        }
                    }

                    window.engine = await asyncEngineCreation();
        if (!engine) throw 'engine should not be null.';
        startRenderLoop(engine, canvas);
        window.scene = createScene();};
        initFunction().then(() => {scene.then(returnedScene => { sceneToRender = returnedScene; });

        });

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });
    </script>
</body>
</html>

 */