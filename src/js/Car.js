import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";

export default class Car {
	#body;
	#roof;
	#wheels;
	#id;
	#color;
	#scene;

	constructor(args) {
		const { id, color, scene } = args;
		this.#id = id;
		this.#color = color;
		this.#scene = scene;
		this.#wheels = {
			driverFront: null,
			driverRear: null,
			passengerFront: null,
			passengerRear: null
		}
		this.#build();
	}

	#build () {
		const scene = this.#scene;
		this.#body = MeshBuilder.CreateBox(`${this.#id}-body`, {
			height: .5,
			width: 2,
			depth: 1
		}, scene);
		this.#roof = MeshBuilder.CreateBox(`${this.#id}-roof`, {}, scene);
		this.#wheels.driverFront = MeshBuilder.CreateCylinder(`${this.#id}-wdf`, {}, scene);
		this.#wheels.driverRear = MeshBuilder.CreateCylinder(`${this.#id}-wdr`, {}, scene);
		this.#wheels.passengerFront = MeshBuilder.CreateCylinder(`${this.#id}-wpf`, {}, scene);
		this.#wheels.passengerRear = MeshBuilder.CreateCylinder(`${this.#id}-wpr`, {}, scene);

/*
		this.#body.physicsImpostor = new PhysicsImpostor(this.#body, PhysicsImpostor.BoxImpostor, {}, scene);
		this.#roof.physicsImpostor = new PhysicsImpostor(this.#roof, PhysicsImpostor.BoxImpostor, {}, scene);
		this.#wheels.driverFront = new PhysicsImpostor(this.#wheels.driverFront, PhysicsImpostor.CylinderImpostor, {}, scene);
		this.#wheels.driverRear = new PhysicsImpostor(this.#wheels.driverRear, PhysicsImpostor.CylinderImpostor, {}, scene);
		this.#wheels.passengerFront = new PhysicsImpostor(this.#wheels.passengerFront, PhysicsImpostor.CylinderImpostor, {}, scene);
		this.#wheels.passengerRear = new PhysicsImpostor(this.#wheels.passengerRear, PhysicsImpostor.CylinderImpostor, {}, scene);
*/
	}
}