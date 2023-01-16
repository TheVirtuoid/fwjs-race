import CarBase from "./../cars/CarBase.js";
import {Color3, SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";

export default class Cybertruck extends CarBase {
	constructor(args) {
		super(args);
		this.model.meshes[5].material.albedoColor = this.color;
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'cybertruck.glb', scene);
	}

	addModel(args) {
		const { position } = args;
		const box = this.model.meshes[0];
		box.position = position.clone();
		// box.rotate(new Vector3(0, 1, 0), 90 * Math.PI / 180);
		// box.position.x += 1;
		box.scaling.scaleInPlace(.5);
		box.isVisible = true;
		this.setTelemetryMesh(this.model.meshes[5]);
		return box;
	}
}
