import CarBase from "./../cars/CarBase.js";
import {SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";

export default class Ferrari extends CarBase {
	constructor(args) {
		super(args);
		const { boundingVectors } = args;
		this.model.meshes[9].material.albedoColor = this.color;
	}

	setModelSize(boundingVectors) {
		const { maximumWorld, minimumWorld } = this.model.meshes[9].getBoundingInfo().boundingBox;
		this.modelSize = {
			width: Math.sqrt(maximumWorld.x * maximumWorld.x + minimumWorld.x * minimumWorld.x),
			height: Math.sqrt(maximumWorld.y * maximumWorld.y + minimumWorld.y * minimumWorld.y),
			depth: Math.sqrt(maximumWorld.z * maximumWorld.z + minimumWorld.z * minimumWorld.z)
		};
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'Ferarri.glb', scene);
	}

	addModel(args) {
		const { position, scale } = args;
		const box = this.model.meshes[0];
		// box.scaling.scaleInPlace(scale);
		box.position = position.clone();
		box.rotate(new Vector3(0, 1, 0), -90 * Math.PI / 180);
		box.isVisible = true;
		this.setTelemetryMesh(this.model.meshes[9]);
		return box;
	}
}
