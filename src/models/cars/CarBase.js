import {
	Color3,
	HingeJoint,
	MeshBuilder, PhysicsImpostor, SceneLoader, StandardMaterial, Texture,
	Vector3
} from "@babylonjs/core";

const zeroMass = false;

/*
	height = y-axis
	depth = side-to-side axis
	width = front-to-back axis
 */

const carHeight = 2;
const carDepth = 4;
const carWidth = 8;

const defaults = {
	wheel: {
		diameter: 1.5,
		height: 1,
		mass: zeroMass ? 0 : 23,
		friction: 50,
		restitution: 0
	},
	wheelBase: {
		depth: carDepth * .1,
		width: carWidth * .1,
		height: carHeight * .25,
		mass: zeroMass ? 0 : 1302,
		friction: 5,
		restitution: 0
	},
	chassis: {
		depth: carDepth * .75,
		height: carHeight * .25,
		width: carWidth,
		mass: 1,
		friction: 0,
		restitution: 0
	},
	/*chassis: {
		depth: .75,
		height: .25,
		width: 1,
		mass: 1,
		friction: 0,
		restitution: 0
	},*/
	box: {
		depth: carDepth,
		height: carHeight,
		width: carWidth,
		mass: zeroMass ? 0 : 200,
		friction: 0,
		restitution: 0
	}
};

const halfDepth = defaults.chassis.depth / 2;
const baseAdjust = defaults.chassis.width / 8;
const wheelParameters = [
	{ wheelName: 'rightFront', pivot: new Vector3(-halfDepth - baseAdjust, halfDepth, 0) },
	{ wheelName: 'rightRear', pivot: new Vector3(halfDepth + baseAdjust, halfDepth, 0) },
	{ wheelName: 'leftFront', pivot: new Vector3(-halfDepth - baseAdjust, -halfDepth, 0)},
	{ wheelName: 'leftRear', pivot: new Vector3(halfDepth + baseAdjust, -halfDepth, 0) }
];

export default class CarBase {

	#wheelBase;
	#wheels;
	#scene;
	#chassis;
	#box;
	#scale;
	#wheelParameters;
	#defaults;
	#built;
	#position;
	#name;
	#color;
	#rotate;
	#distanceTravelled;
	#previousPosition;
	#baseColor;
	#slot;

	#model;

	#telemetryMesh;

	#boundingVectors;
	#modelSize;

	static Load(scene) {
		return Promise.resolve(null);
	}

	constructor(args = {}) {
		const { slot, scale = 1, scene, position, name, color, rotate = 0, model = null, boundingVectors = null }= args;
		this.#scale = scale;
		this.#scene = scene;
		this.#position = position;
		this.#name = name;
		this.#baseColor = color;
		this.#model = model;
		const { red, green, blue } = this.#hashToColor(color);
		this.#color = new Color3(red, green, blue);
		this.#rotate = rotate * Math.PI / 180;
		this.#slot = slot;
		this.#boundingVectors = boundingVectors;
		this.#wheelParameters = wheelParameters.map((wheelParameter) => {
			let { wheelName, pivot } = wheelParameter;
			return { wheelName, pivot: this.#scaleVector3(pivot) };
		});
		this.setModelSize(this.#boundingVectors);
		console.log(this.#boundingVectors, this.#modelSize);
		this.#defaults = {
			wheel: {
				diameter: defaults.wheel.diameter * this.#scale,
				height: defaults.wheel.height * this.#scale,
				mass: defaults.wheel.mass * this.#scale,
				restitution: defaults.wheel.restitution
			},
			wheelBase: {
				depth: defaults.wheelBase.depth * this.#scale,
				width: defaults.wheelBase.width * this.#scale,
				height: defaults.wheelBase.height * this.#scale,
				mass: defaults.wheelBase.mass * this.#scale,
				restitution: defaults.wheelBase.restitution
			},
			chassis: {
				depth: this.#modelSize.depth * this.#scale,
				width: this.#modelSize.width * this.#scale,
				height: this.#modelSize.height * this.#scale,
				/*depth: defaults.chassis.depth * this.#scale,
				width: defaults.chassis.width * this.#scale,
				height: defaults.chassis.height * this.#scale,*/
				mass: defaults.chassis.mass * this.#scale,
				restitution: defaults.chassis.restitution
			},
			box: {
				depth: defaults.box.depth * this.#scale,
				width: defaults.box.width * this.#scale,
				height: defaults.box.height * this.#scale,
				mass: defaults.box.mass * this.#scale,
				restitution: defaults.box.restitution
			}
		}
		this.#built = false;
		this.#distanceTravelled = 0;
		this.#telemetryMesh = null;

	}

	setModelSize(boundingVectors) {
		let width = carWidth;
		let height = carHeight;
		let depth = carDepth;
		if (boundingVectors) {
			const { max, min } = boundingVectors;
			height = (max.y - min.y) * 0.49222866454548153;
			depth = (max.x - min.x) * 2.4063928768304086;
			width = (max.z - min.z) * 2.0967996763358596;
		}
		this.#modelSize = { width, height, depth };
	}

	build (args = {}) {
		if (!this.#built) {
			const { scene: inScene, position: inPosition, name: inName, color: inColor } = args;
			this.#scene = inScene ?? this.#scene;
			this.#position = inPosition ?? this.#position;
			this.#name = inName ?? this.#name;
			this.#color = inColor ?? this.#color;
			const [scene, position, name, color, rotate, model] = [this.#scene, this.#position, this.#name, this.#color, this.#rotate, this.#model];
			let wheelBase = this.#addWheelBase({ scene, position, name });
			let wheels = this.#wheelParameters.map((wheel) => {
				const { wheelName, pivot } = wheel;
				return this.#addWheel({ name, scene, position, wheelName, pivot });
			});
			let chassis = this.#addChassis({ name, scene, position, color });
			let box = this.#addBox({ name, scene, position, color, rotate, scale: this.#scale + .2 });

			wheelBase.addChild(chassis);
			wheelBase.addChild(box);
			({ wheelBase, wheels, chassis, box } = this.#setPhysics({ wheelBase, wheels, chassis, box }));
			this.#chassis = chassis;
			this.#wheelBase = wheelBase;
			this.#wheels = wheels;
			this.#scene = scene;
			this.#box = box;
			this.#model = model;
			this.#built = true;
			this.#distanceTravelled = 0;
			this.#previousPosition = this.#wheelBase.position;
		}
	}

	adjustRotation(forwardVector, radians) {
		const { x, y, z } = forwardVector;
		this.#wheelBase.rotate(new Vector3(x, y, z), radians);
	}

	junk () {
		if (this.#built) {
			this.#scene.removeMesh(this.#wheelBase);
			this.#wheelBase.physicsImpostor.dispose();
			this.#wheelBase.dispose();
			this.#wheelBase = null;
			this.#wheels.forEach((wheel) => {
				this.#scene.removeMesh(wheel);
				wheel.physicsImpostor.dispose();
				wheel.dispose();
			});
			this.#wheels = [];
			this.#built = false;
			this.#distanceTravelled = 0;
		}
	}

	get chassis () {
		return this.#chassis;
	}

	get height () {
		return defaults.wheel.height * this.#scale;
	}

	get width () {
		return defaults.chassis.depth * this.#scale + defaults.wheel.diameter * this.#scale;
	}

	get wheelBase() {
		return this.#wheelBase;
	}

	get length () {
		return defaults.chassis.width * this.#scale;
	}

	get name () {
		return this.#name;
	}

	get position () {
		return this.#wheelBase.position;
	}

	get slot () {
		return this.#slot;
	}

	get color () {
		return this.#color;
	}

	get model () {
		return this.#model;
	}

	get telemetryMesh () {
		return this.#telemetryMesh;
	}

	get distanceTravelled () {
		return this.#distanceTravelled;
	}

	get wheels () {
		return this.#wheels;
	}

	setTelemetryMesh(mesh) {
		this.#telemetryMesh = mesh;
	}

	setDistanceTravelled() {
		if (this.#built) {
			this.#distanceTravelled += Vector3.Distance(this.#previousPosition, this.#wheelBase.position);
			this.#previousPosition = this.#wheelBase.position;
		}
	}

	resetDistanceTravelled(distance = 0) {
		this.#distanceTravelled = distance;
	}

	addModel(args) {
		const { name, scene, position, color, rotate, scale } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.box;
		const box = MeshBuilder.CreateBox(`${name}-box`, { depth, height, width, faceColors }, scene);
		box.position = position.clone();
		box.position.y += .25;
		box.isVisible = true;
		this.setTelemetryMesh(box);
		return box;
	}


	#scaleVector3(vector) {
		const x = vector.x * this.#scale;
		const y = vector.y * this.#scale;
		const z = vector.z * this.#scale;
		return new Vector3(x, y, z);
	}

	// the wheelBase was the old axle
	#addWheelBase(args = {}) {
		const { name, scene, position } = args;
		const { depth, width, height } = this.#defaults.wheelBase;
		const wheelBase = MeshBuilder.CreateBox(`${name}-wheelbase`, { depth, width, height }, scene);
		wheelBase.rotation.x = Math.PI / 2;
		wheelBase.position = position.clone();
		wheelBase.isVisible = false;
		return wheelBase;
	}

	#addWheel(args = {}) {
		const { name, scene, position, wheelName, pivot } = args;
		const { diameter, height } = this.#defaults.wheel;
		const wheel = MeshBuilder.CreateSphere(`${name}-wheel-${wheelName}`, {
			diameterX: diameter,
			diameterY: diameter / 2,
			diameterZ: diameter
		}, scene);
		wheel.material = new StandardMaterial(`${name}-wheelmat-${wheelName}`, scene);
		wheel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		wheel.isVisible = false;
		return { wheel, pivot };
	}

	#addChassis(args = {}) {
		const { name, scene, position, color } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.chassis;
		const chassis = MeshBuilder.CreateBox(`${name}-chassis`, { depth, height, width, faceColors }, scene);
		chassis.position = position.clone();
		chassis.isVisible = false;
		return chassis;
	}

	#addBox(args = {}){
		return this.addModel(args);
	}

	#setPhysics(args = {}) {
		const { wheelBase, wheels, chassis, box } = args;
		const { mass: wheelMass, friction: wheelFriction, restitution: wheelRestitution } = this.#defaults.wheel;
		const { mass: wheelBaseMass, height, friction: wheelBaseFriction, restitution: wheelBaseRestitution } = this.#defaults.wheelBase;
		const { mass: chassisMass, friction: chassisFriction, restitution: chassisRestitution } = this.#defaults.chassis;
		const { mass: boxMass, friction: boxFriction, restitution: boxRestitution } = this.#defaults.box;

		// box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.NoImpostor, { mass: boxMass, friction: boxFriction, restitution: boxRestitution });
		chassis.physicsImpostor = new PhysicsImpostor(chassis, PhysicsImpostor.BoxImpostor, { mass: chassisMass, friction: chassisFriction, restitution: chassisRestitution });
		wheelBase.physicsImpostor = new PhysicsImpostor(wheelBase, PhysicsImpostor.CylinderImpostor, { mass: wheelBaseMass, friction: wheelBaseFriction, restitution: wheelBaseRestitution });
		wheels.forEach((wheelData) => {
			const { wheel, pivot } = wheelData;
			wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.SphereImpostor, { mass: wheelMass, friction: wheelFriction, restitution: wheelRestitution });
			const joint = new HingeJoint({
				mainPivot: pivot,
				connectedPivot: new Vector3(0, 0, 0),
				mainAxis: new Vector3(0, 1, 0),
				connectedAxis: new Vector3(0, 1, 0),
				nativeParams: {}
			});
			wheelBase.physicsImpostor.addJoint(wheel.physicsImpostor, joint);
		});
		return { wheelBase, wheels: wheels.map((wheelData) => wheelData.wheel), chassis, box };
	}

	#hashToColor(hash) {
		const red = parseInt(hash.substring(1, 3), 16) / 256;
		const green = parseInt(hash.substring(3, 5), 16) / 256;
		const blue = parseInt(hash.substring(5, 7), 16) / 256;
		return { red, green, blue };
	}

}
