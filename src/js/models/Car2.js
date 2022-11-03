import {
	Axis,
	Color3, Color4,
	CreateBoxVertexData,
	CreateCylinderVertexData, HingeJoint,
	Mesh, MeshBuilder, PhysicsImpostor, Quaternion, Space, StandardMaterial, Texture,
	Vector3
} from "@babylonjs/core";

const defaults = {
	wheel: {
		diameter: 1.5,
		height: 1,
		mass: 23
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
		mass: 1302
	},
	chassis: {
		depth: 3,
		height: .5,
		width: 8,
		mass: 0
	},
	box: {
		depth: 4,
		height: 2,
		width: 8,
		mass: 200
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

export default class Car2 {

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

	constructor(args = {}) {
		const { scale = 1, scene, position, name, color, wheelType = 'ellipse', rotate = 0 }= args;
		this.#scale = scale;
		this.#scene = scene;
		this.#position = position;
		this.#name = name;
		this.#color = color;
		this.#wheelType = wheelType;
		this.#rotate = rotate * Math.PI / 180;
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
	}

	build (args = {}) {
		if (!this.#built) {
			const { scene: inScene, position: inPosition, name: inName, color: inColor, rotate: inRotate } = args;
			this.#scene = inScene ?? this.#scene;
			this.#position = inPosition ?? this.#position;
			this.#name = inName ?? this.#name;
			this.#color = inColor ?? this.#color;
			this.#rotate = inRotate ? inRotate * Math.PI / 180 : this.#rotate;
			const [scene, position, name, color, rotate] = [this.#scene, this.#position, this.#name, this.#color, this.#rotate];
			let wheelBase = this.#addWheelBase({ scene, position, name });
			let wheels = this.#wheelParameters.map((wheel) => {
				const { wheelName, pivot } = wheel;
				return this.#addWheel({ name, scene, position, wheelName, pivot });
			});
			let chassis = this.#addChassis({ name, scene, position, color });
			let box = this.#addBox({ name, scene, position, color });
			wheelBase.addChild(chassis);
			wheelBase.addChild(box);
			wheelBase.rotate(new Vector3(0, 1, 0), rotate);
			({ wheelBase, wheels, chassis, box } = this.#setPhysics({ wheelBase, wheels, chassis, box }));
			this.#chassis = chassis;
			this.#wheelBase = wheelBase;
			this.#wheels = wheels;
			this.#scene = scene;
			this.#box = box;
			this.#built = true;
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
		wheelBase.isVisible = true;
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
		return { wheel, pivot };
	}

	#addChassis(args = {}) {
		const { name, scene, position, color } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.chassis;
		const chassis = MeshBuilder.CreateBox(`${name}-chassis`, { depth, height, width, faceColors }, scene);
		chassis.position = position.clone();
		chassis.isVisible = true;
		return chassis;
	}

	#addBox(args = {}){
		const { name, scene, position, color } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.box;
		const box = MeshBuilder.CreateBox(`${name}-box`, { depth, height, width, faceColors }, scene);
		box.position = position.clone();
		box.position.y += .25;
		box.isVisible = true;
		return box;
	}

	#setPhysics(args = {}) {
		const { wheelBase, wheels, chassis, box } = args;
		const { mass: wheelMass } = this.#defaults.wheel;
		const { mass: wheelBaseMass, height } = this.#defaults.wheelBase;
		const { mass: chassisMass } = this.#defaults.chassis;
		const { mass: boxMass } = this.#defaults.box;

		box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, { mass: boxMass, friction: 50, restitution: 0 });
		chassis.physicsImpostor = new PhysicsImpostor(chassis, PhysicsImpostor.BoxImpostor, { mass: chassisMass, friction: 1, restitution: 0 });
		wheelBase.physicsImpostor = new PhysicsImpostor(wheelBase, PhysicsImpostor.CylinderImpostor, { mass: wheelBaseMass, friction: 1, restitution: 0 });
		wheels.forEach((wheelData) => {
			const { wheel, pivot } = wheelData;
			switch(this.#wheelType) {
				case 'round':
				case 'ellipse':
					wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.SphereImpostor, { mass: wheelMass, friction: 3, restitution: 0 });
					break;
				case 'cylinder':
					wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: wheelMass, friction: 1, restitution: 0 });
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

}
