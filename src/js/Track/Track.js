import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";

export default class Track {
	#track;

	constructor(args) {
		const { scene } = args;
		// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
		const ground = MeshBuilder.CreateGround("ground1", { width: 8, height: 8 }, scene);
		ground.rotation.z = Math.PI / 16;
		ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.8 }, scene);
		this.#track = ground;
	}
}