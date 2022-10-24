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
		diameter: 2,
		height:.5,
		mass: 10
	},
	wheelBase: {
		depth: .25,
		width: 1,
		height: 2,
		mass: 1
	},
	chassis: {
		depth: 4,
		height: .5,
		width: 8,
		mass: 0
	}
};

const wheelParameters = [
	{ wheelName: 'rightFront', offset: new Vector3(2.5, 0, -2.5), pivot: new Vector3(2.5, -2.5, 0) },
	{ wheelName: 'rightRear', offset: new Vector3(-2.5, 0, -2.5), pivot: new Vector3(-2.5, -2.5, 0) },
	{ wheelName: 'leftFront', offset: new Vector3(2.5, 0, 2.5),  pivot: new Vector3(2.5, 2.5, 0)},
	{ wheelName: 'leftRear', offset: new Vector3(-2.5, 0, 2.5), pivot: new Vector3(-2.5, 2.5, 0) }
];

export default class Car {

	#wheelBase;
	#wheels;
	#scene;
	#chassis;
	#scale;
	#wheelParameters;
	#defaults;
	#built;

	constructor(args = {}) {
		const { scale = 1 } = args;
		this.#scale = scale;
		this.#wheelParameters = wheelParameters.map((wheelParameter) => {
			let { wheelName, offset, pivot } = wheelParameter;
			return { wheelName, offset: this.#scaleVector3(offset), pivot: this.#scaleVector3(pivot) };
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
			}
		}
		this.#built = false;
	}

	build (args = {}) {
		const { scene, position, name, color } = args;
		if (!this.#built) {
			let wheelBase = this.#addWheelBase({ scene, position, name });
			let wheels = this.#wheelParameters.map((wheel) => {
				const { wheelName, offset, pivot } = wheel;
				return this.#addWheel({ name, scene, position, wheelName, offset, pivot });
			});
			let chassis = this.#addChassis({ name, scene, position, color });
			wheelBase.addChild(chassis);
			({ wheelBase, wheels, chassis } = this.#setPhysics({ wheelBase, wheels, chassis }));
			this.#chassis = chassis;
			this.#wheelBase = wheelBase;
			this.#wheels = wheels;
			this.#scene = scene;
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
		const { name, scene, position, wheelName, offset, pivot } = args;
		const { diameter, height } = this.#defaults.wheel;
		//const wheel = MeshBuilder.CreateCylinder(`${name}-wheel-${wheelName}`, { diameter, height }, scene);
		const wheel = MeshBuilder.CreateSphere(`${name}-wheel-${wheelName}`, { diameter }, scene);
		wheel.material = new StandardMaterial(`${name}-wheelmat-${wheelName}`, scene);
		wheel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		wheel.position.addInPlace(offset);
		return { wheel, pivot };
	}

	#addChassis(args = {}) {
		const { name, scene, position, color } = args;
		const faceColors = [color, color, color, color, color, color];
		const { depth, height, width } = this.#defaults.chassis;
		const chassis = MeshBuilder.CreateBox(`${name}-chassis`, { depth, height, width, faceColors }, scene);
		chassis.position = position.clone();
		return chassis;
	}

	#setPhysics(args = {}) {
		const { wheelBase, wheels, chassis } = args;
		const { mass: wheelMass } = this.#defaults.wheel;
		const { mass: wheelBaseMass, height } = this.#defaults.wheelBase;
		const { mass: chassisMass } = this.#defaults.chassis;

		chassis.physicsImpostor = new PhysicsImpostor(chassis, PhysicsImpostor.BoxImpostor, { mass: chassisMass, friction: 1, restitution: 0 });
		wheelBase.physicsImpostor = new PhysicsImpostor(wheelBase, PhysicsImpostor.CylinderImpostor, { mass: wheelBaseMass, friction: 1, restitution: 0 });
		wheels.forEach((wheelData) => {
			const { wheel, pivot } = wheelData;
			// wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: wheelMass, friction: 1, restitution: 0 });
			wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.SphereImpostor, { mass: wheelMass, friction: 1, restitution: 0 });
			const joint = new HingeJoint({
				mainPivot: pivot,
				connectedPivot: new Vector3(0, 0, 0),
				mainAxis: new Vector3(0, 1, 0),
				connectedAxis: new Vector3(0, 1, 0),
				nativeParams: {}
			});
			wheelBase.physicsImpostor.addJoint(wheel.physicsImpostor, joint);
		});
		return { wheelBase, wheels: wheels.map((wheelData) => wheelData.wheel), chassis };
	}

}
