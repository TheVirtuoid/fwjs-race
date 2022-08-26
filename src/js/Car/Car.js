import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";

export default class Car {
	#vehicle;

	constructor(args) {
		const { scene } = args;
		// Our built-in 'sphere' shape. Params: name, subdivs, size, scene
		const vehicle = MeshBuilder.CreateSphere("sphere1", { diameter: 2, segments: 16 }, scene);
		vehicle.position.y = 2;
		vehicle.physicsImpostor = new PhysicsImpostor(vehicle, PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.8 }, scene);
		this.#vehicle = vehicle;
	}
}