import CarBase from "./../cars/CarBase.js";
import {Color3, SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";

export default class Cybertruck extends CarBase {
	constructor(args) {
		super({...args, ...{ scale: .25, type: 'Cybertruck' }});
		this.model.meshes[5].material.albedoColor = this.color;
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'cybertruck.glb', scene);
	}

	setModelSize(boundingVectors) {
		const { maximumWorld, minimumWorld } = this.model.meshes[5].getBoundingInfo().boundingBox;
		this.modelSize = {
			width: Math.sqrt(maximumWorld.x * maximumWorld.x + minimumWorld.x * minimumWorld.x),
			height: Math.sqrt(maximumWorld.y * maximumWorld.y + minimumWorld.y * minimumWorld.y),
			depth: Math.sqrt(maximumWorld.z * maximumWorld.z + minimumWorld.z * minimumWorld.z)
		};
	}

	addModel(args) {
		const { position } = args;
		const box = this.model.meshes[0];
		box.position = position.clone();
		box.isVisible = true;
		this.setTelemetryMesh(this.model.meshes[5]);
		return box;
	}
}
