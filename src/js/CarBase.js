import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";

export default class CarBase {
	#position;
	#wheel;
	#scene;

	#wheelOptions = {
		mass: 1,
		restitution: 0,
		friction: 10
	}
	constructor(args = {}) {
		const { position, scene } = args;
		this.#position = position.clone();
		this.#scene = scene;
	}

	build() {
		this.#wheel = MeshBuilder.CreateSphere("wheel", { diameter: .5 }, this.#scene);
		this.#wheel.position = this.#position;
		this.#wheel.physicsImpostor = new PhysicsImpostor(this.#wheel, PhysicsImpostor.SphereImpostor, this.#wheelOptions);
	}
}