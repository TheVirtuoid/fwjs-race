import { Scene } from "@babylonjs/core";

export default class Stage {
	#scene;

	constructor(args) {
		const { engine } = args;
		// This creates a basic Babylon Scene object (non-mesh)
		const scene = new Scene(engine);
		scene.enablePhysics();
		this.#scene = scene;
	}

	get scene() {
		return this.#scene;
	}
}