import CarBase from "./../cars/CarBase.js";
import {SceneLoader, Vector3} from "@babylonjs/core";

export default class Ferarri extends CarBase {
	constructor(args) {
		super(args);
		this.model["meshes"][9].material.albedoColor = this.color;
		this.model["meshes"][0].scaling.scaleInPlace(.9);
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'Ferarri.glb', scene);
	}

	addModel(args) {
		const { name, scene, position, color, rotate, scale } = args;
		const faceColors = [color, color, color, color, color, color];
		const box = this.model["meshes"][0];
		box.scaling.scaleInPlace(scale);
		box.position = position.clone();
		box.rotate(new Vector3(0, 1, 0), rotate);
		box.rotate(new Vector3(0, 1, 0), 3.75);
		box.isVisible = true;
		this.setTelemetryMesh(this.model["meshes"][9]);
		return box;
	}
}
