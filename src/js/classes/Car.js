import {
	HingeJoint, PhysicsJoint,
	MeshBuilder, PhysicsImpostor, StandardMaterial, Texture,
	Vector3, Hinge2Joint
} from "@babylonjs/core";

const wheelParameters = [
	{ wheelName: 'rightFront', offset: new Vector3(0, 0, 0), pivot: new Vector3(0, -2.5, 0) },
	{ wheelName: 'rightRear', offset: new Vector3(-5, 0, 0), pivot: new Vector3(-5, -2.5, 0) },
	{ wheelName: 'leftFront', offset: new Vector3(0, 0, 5),  pivot: new Vector3(0, 2.5, 0)},
	{ wheelName: 'leftRear', offset: new Vector3(-5, 0, 5), pivot: new Vector3(-5, 2.5, 0) }
];
const defaults = {
	wheel: {
		diameter: 2,
		height:.5,
		mass: 10
	},
	wheelBase: {
		depth: 1,
		width: .5,
		height: 5,
		mass: 1
	}
};

export default class Car {

	#wheelBase;
	#wheels;
	#scale;
	#wheelParameters;
	#defaults;

	constructor(args = {}) {
		const { scale = .25 } = args;
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
			}
		}
	}

	build (args = {}) {
		const { scene, position, name } = args;
		let wheelBase = this.#addWheelBase({ scene, position, name });
		let wheels = this.#wheelParameters.map((wheel) => {
			const { wheelName, offset, pivot } = wheel;
			return this.#addWheel({ name, scene, position, wheelName, offset, pivot });
		});
		({ wheelBase, wheels } = this.#setPhysics({ wheelBase, wheels }));
		this.#wheelBase = wheelBase;
		this.#wheels = wheels;
	}

	junk() {
		this.#wheels.forEach((wheel) => {
			wheel.physicsImpostor.dispose();
			wheel.dispose();
		});
		this.#wheelBase.physicsImpostor.dispose();
		this.#wheelBase.dispose();
		this.#wheelBase = null;
		this.#wheels = [];
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
		const wheel = MeshBuilder.CreateCylinder(`${name}-wheel-${wheelName}`, { diameter, height }, scene);
		wheel.material = new StandardMaterial(`${name}-wheelmat-${wheelName}`, scene);
		wheel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		wheel.position.addInPlace(offset);
		return { wheel, pivot };
	}

	#setPhysics(args = {}) {
		const { wheelBase, wheels } = args;
		const { mass: wheelMass } = this.#defaults.wheel;
		const { mass: wheelBaseMass, height } = this.#defaults.wheelBase;

		wheelBase.physicsImpostor = new PhysicsImpostor(wheelBase, PhysicsImpostor.CylinderImpostor, { mass: wheelBaseMass });
		wheels.forEach((wheelData) => {
			const { wheel, pivot } = wheelData;
			console.log(wheel, pivot);
			wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: wheelMass, friction: 1 });
			const joint = new PhysicsJoint(PhysicsJoint.HingeJoint, {
				mainPivot: pivot,
				connectedPivot: new Vector3(0, 0, 0),
				mainAxis: new Vector3(0, 1, 0),
				connectedAxis: new Vector3(0, 1, 0),
				nativeParams: {}
			});
			wheelBase.physicsImpostor.addJoint(wheel.physicsImpostor, joint);
		});
		return { wheelBase, wheels: wheels.map((wheelData) => wheelData.wheel)};
	}
}
