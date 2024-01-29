import CarBase from "./../cars/CarBase.js";
import {SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";


export default class LowPoly2 extends CarBase {
	constructor(args) {
		super(args);
		this.model["meshes"][1].material.albedoColor = this.color;
		this.model["meshes"][0].scaling.scaleInPlace(1.5);
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'LowPoly2.glb', scene);
	}

	addModel(args) {
		const { name, scene, position, color, rotate, scale } = args;
		const faceColors = [color, color, color, color, color, color];
		const box = this.model["meshes"][0];
		box.scaling.scaleInPlace(scale);
		box.position = position.clone();
		/*box.rotate(new Vector3(0, 1, 0), rotate);
		box.rotate(new Vector3(0, 1, 0), .15);*/
		box.isVisible = true;
		this.setTelemetryMesh(this.model["meshes"][0]);
		console.log(this.model["meshes"]);
		return box;
	}
}
