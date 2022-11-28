import {SceneLoader} from "@babylonjs/core";

export default class Car3 {
	#model;

	constructor(args = {}) {
		const { scene } = args;

		SceneLoader.Append("/models/", 'Car3.glb', scene, this.#modelLoaded.bind(this));
	}

	#modelLoaded(scene) {
		console.log('car loaded');
	}
}