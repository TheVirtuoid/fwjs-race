import {FreeCamera, Vector3} from "@babylonjs/core";

export default class Camera {
	#camera;

	constructor (args) {
		const { scene, world } = args;
		// This creates and positions a free camera (non-mesh)
		const camera = new FreeCamera("camera1", new Vector3(0, 5, -30), scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(world, true);
		this.#camera = camera;
	}
}