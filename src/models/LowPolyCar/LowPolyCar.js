import CarBase from "./../cars/CarBase.js";
import {SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";


export default class LowPolyCar extends CarBase {
	constructor(args) {
		super(args);
		this.model.meshes[1].material.albedoColor = this.color;
	}

	setModelSize(boundingVectors) {
		const { maximumWorld, minimumWorld } = this.model.meshes[1].getBoundingInfo().boundingBox;
		this.modelSize = {
			width: Math.sqrt(maximumWorld.x * maximumWorld.x + minimumWorld.x * minimumWorld.x),
			height: Math.sqrt(maximumWorld.y * maximumWorld.y + minimumWorld.y * minimumWorld.y),
			depth: Math.sqrt(maximumWorld.z * maximumWorld.z + minimumWorld.z * minimumWorld.z)
		};
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'LowPolyCar.glb', scene);
	}

	addModel(args) {
		const { position } = args;
		const box = this.model.meshes[0];
		box.position = position.clone();
		box.rotate(new Vector3(0, 1, 0), -90 * Math.PI / 180);
		box.isVisible = true;
		this.setTelemetryMesh(this.model.meshes[1]);
		return box;
	}
}
