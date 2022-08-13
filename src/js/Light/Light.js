import {HemisphericLight, Vector3} from "@babylonjs/core";

export default class Light {

	#light;
	#scene;

	constructor(args) {
		const { scene } = args;
		this.#scene = scene;
		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		this.#light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
		this.intensity = 0.7;
	};

	get intensity () {
		return this.#light.intensity;
	}

	set intensity (value) {
		this.#light.intensity = value;
	}
}