import {
	Axis,
	Color3, Color4,
	CreateBoxVertexData,
	CreateCylinderVertexData, HingeJoint,
	Mesh, MeshBuilder, PhysicsImpostor, Quaternion, SceneLoader, Space, StandardMaterial, Texture,
	Vector3
} from "@babylonjs/core";

const zeroMass = false;

const defaults = {
	wheel: {
		diameter: 1.5,
		height: 1,
		mass: zeroMass ? 0 : 23,
		friction: 50
	},
/*	wheelBase: {
		depth: .25,
		width: 1,
		height: 2,
		mass: 1302
	},*/
		wheelBase: {
		depth: .1,
		width: .5,
		height: .5,
		mass: zeroMass ? 0 : 1302,
		friction: 5
	},
	chassis: {
		depth: 3,
		height: .5,
		width: 8,
		mass: 0,
		friction: 0
	},
	box: {
		depth: 4,
		height: 2,
		width: 8,
		mass: zeroMass ? 0 : 200,
		friction: 0
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

export default class LowPolyCar {

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
	#wheelType;
	#rotate;
	#distanceTravelled;
	#previousPosition;
	#baseColor;
	#slot;

	#model;

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'LowPolyCar.glb', scene);
	}

	constructor(args = {}) {
		const { slot, scale = 1, scene, position, name, color, wheelType = 'ellipse', rotate = 0, model = null }= args;
		this.#scale = scale;
		this.#scene = scene;
		this.#position = position;
		this.#name = name;
		this.#baseColor = color;
		this.#model = model;
		const { red, green, blue } = this.#hashToColor(color);
		// console.log(models[0].meshes[1].material.albedoColor);
		// models[0].meshes[1].material.albedoColor.g = 1;
		this.#color = new Color3(red, green, blue);
		this.#model.meshes[1].material.albedoColor = new Color3(red, green, blue);
		// console.log(this.#color);
		this.#wheelType = wheelType;
		this.#rotate = rotate * Math.PI / 180;
		this.#slot = slot;
		this.#wheelParameters = wheelParameters.map((wheelParameter) => {
			let { wheelName, pivot } = wheelParameter;
			return { wheelName, pivot: this.#scaleVector3(pivot) };
		});
		this.#defaults = {
			wheel: {
				diameter: defaults.wheel.diameter * this.#scale,
				height: defaults.wheel.height * this.#scale,
				mass: defaults.wheel.mass * this.#scale,
			},
			wheelBase: {
				depth: defaults.wheelBase.depth * this.#scale,
				width: defaults.wheelBase.width * this.#scale,
				height: defaults.wheelBase.height * this.#scale,
				mass: defaults.wheelBase.mass * this.#scale
			},
			chassis: {
				depth: defaults.chassis.depth * this.#scale,
				width: defaults.chassis.width * this.#scale,
				height: defaults.chassis.height * this.#scale,
				mass: defaults.chassis.mass * this.#scale
			},
			box: {
				depth: defaults.box.depth * this.#scale,
				width: defaults.box.width * this.#scale,
				height: defaults.box.height * this.#scale,
				mass: defaults.box.mass * this.#scale
			}
		}
		this.#built = false;
		this.#distanceTravelled = 0;
		if (this.#model?.meshes) {
			this.#model.meshes[0].scaling.scaleInPlace(.9);
		}
	}

	#modelLoaded(model) {
		this.#model = model;
		model.meshes[0].scaling.scaleInPlace(this.#scale);
		const car = model.meshes[0];
		// const { name, scene, position, color } = args;
		// const faceColors = [color, color, color, color, color, color];
		// const { depth, height, width } = this.#defaults.box;
		// const box = MeshBuilder.CreateBox(`${name}-box`, { depth, height, width, faceColors }, scene);
		car.position = this.#position.clone();
		// car.position.y += .25;
		// car.isVisible = true;
		return car;
	}

	build (args = {}) {
		if (!this.#built) {
			const { scene: inScene, position: inPosition, name: inName, color: inColor, rotate: inRotate } = args;
			this.#scene = inScene ?? this.#scene;
			this.#position = inPosition ?? this.#position;
			this.#name = inName ?? this.#name;
			this.#color = inColor ?? this.#color;
			this.#rotate = inRotate ? inRotate * Math.PI / 180 : this.#rotate;
			const [scene, position, name, color, rotate, model] = [this.#scene, this.#position, this.#name, this.#color, this.#rotate, this.#model];
			// model.meshes[0].posiiton = position.clone();
			let wheelBase = this.#addWheelBase({ scene, position, name });
			let wheels = this.#wheelParameters.map((wheel) => {
				const { wheelName, pivot } = wheel;
				return this.#addWheel({ name, scene, position, wheelName, pivot });
			});
			let chassis = this.#addChassis({ name, scene, position, color });
			let box = this.#addBox({ name, scene, position, color, rotate, scale: this.#scale + .2 });
			// wheelBase.addChild(model.meshes[0]);
			wheelBase.addChild(chassis);
			wheelBase.addChild(box);
			wheelBase.rotate(new Vector3(0, 1, 0), rotate);
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

	get distanceTravelled () {
		return this.#distanceTravelled;
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
		let wheel;
		switch (this.#wheelType) {
			case 'round':
				wheel = MeshBuilder.CreateSphere(`${name}-wheel-${wheelName}`, { diameter }, scene);
				break;
			case 'ellipse':
				wheel = MeshBuilder.CreateSphere(`${name}-wheel-${wheelName}`, {
					diameterX: diameter,
					diameterY: diameter / 2,
					diameterZ: diameter
				}, scene);
				break;
			case 'cylinder':
				wheel = MeshBuilder.CreateCylinder(`${name}-wheel-${wheelName}`, { diameter, height }, scene);
				break;
		}
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
		const { name, scene, position, color, rotate, scale } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.box;
		// const box = MeshBuilder.CreateBox(`${name}-box`, { depth, height, width, faceColors }, scene);
		const box = this.#model.meshes[0];
		box.scaling.scaleInPlace(scale);
		box.position = position.clone();
		// box.position.y += .25;
		box.rotate(new Vector3(0, 1, 0), rotate);
		box.rotate(new Vector3(0, 1, 0), 3.75);
		box.isVisible = true;
		return box;
	}

	#setPhysics(args = {}) {
		const { wheelBase, wheels, chassis, box } = args;
		const { mass: wheelMass, friction: wheelFriction } = this.#defaults.wheel;
		const { mass: wheelBaseMass, height, friction: wheelBaseFriction } = this.#defaults.wheelBase;
		const { mass: chassisMass, friction: chassisFriction } = this.#defaults.chassis;
		const { mass: boxMass, friction: boxFriction } = this.#defaults.box;

		box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, { mass: boxMass, friction: boxFriction, restitution: 0 });
		chassis.physicsImpostor = new PhysicsImpostor(chassis, PhysicsImpostor.BoxImpostor, { mass: chassisMass, friction: chassisFriction, restitution: 0 });
		wheelBase.physicsImpostor = new PhysicsImpostor(wheelBase, PhysicsImpostor.CylinderImpostor, { mass: wheelBaseMass, friction: wheelBaseFriction, restitution: 0 });
		wheels.forEach((wheelData) => {
			const { wheel, pivot } = wheelData;
			switch(this.#wheelType) {
				case 'round':
				case 'ellipse':
					wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.SphereImpostor, { mass: wheelMass, friction: wheelFriction, restitution: 0 });
					break;
				case 'cylinder':
					wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: wheelMass, friction: 0, restitution: 0 });
					break;
			}
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
