import {SceneLoader} from "@babylonjs/core";
import "@babylonjs/loaders";

export default class Car3 {
	#model;

	constructor(args = {}) {
		const { scene } = args;

		// SceneLoader.Append("/models/", 'Car3.glb', scene, this.#modelLoaded.bind(this));
		SceneLoader.ImportMeshAsync(null, '/models/', 'Car3.glb', scene)
				.then(this.#modelLoaded.bind(this))
	}

	#modelLoaded(model) {
		model.meshes[0].scaling.scaleInPlace(.5);
		console.log(model);
		console.log('car loaded');
	}
}