import CarBase from "./../cars/CarBase.js";
import {Color3, MeshBuilder, PhysicsImpostor, SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";
import Body from "../cars/parts/Body";

class CyberTruckBody extends Body {

	constructor(args) {
		super(args);
	}

	addModel(args) {
		const { position } = args;
		const { depth, height, width, name, scene } = this;

		console.log(`d=${depth}, h=${height}, w=${width}`);
		const body = this.model.meshes[0];
		body.scaling.scaleInPlace(1.9);
		body.position = position.clone();
		body.position.z -= depth * .18;
		body.position.x =+ width * .6;
		body.isVisible = true;
		this.mesh = body;

		const colliderMesh = MeshBuilder.CreateBox(`${name}-body-collider`, { depth, height: height * 1.5, width: width * 1.3 }, scene);
		colliderMesh.position = position.clone();
		colliderMesh.position.y += height * .5;
		colliderMesh.isVisible = false;
		colliderMesh.showBoundingBox = true;
		this.colliderMesh = colliderMesh;
		this.model.meshes[0].addChild(this.colliderMesh);
		return this;
	}

	applyPhysics() {
		this.mesh.physicsImpostor = new PhysicsImpostor(
				this.mesh, PhysicsImpostor.CustomImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		this.colliderMesh.physicsImpostor = new PhysicsImpostor(
				this.colliderMesh, PhysicsImpostor.BoxImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		return this;
	}
}

export default class Cybertruck extends CarBase {
	constructor(args) {
		super({ ...args, ...{ BodyFactory: CyberTruckBody } });
		this.model.meshes[5].material.albedoColor = this.color;
		this.setTelemetryMesh(this.model.meshes[5]);
	}

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'cybertruck.glb', scene);
	}

	/*setModelSize(boundingVectors) {
		const { maximumWorld, minimumWorld } = this.model.meshes[5].getBoundingInfo().boundingBox;
		this.modelSize = {
			width: Math.sqrt(maximumWorld.x * maximumWorld.x + minimumWorld.x * minimumWorld.x),
			height: Math.sqrt(maximumWorld.y * maximumWorld.y + minimumWorld.y * minimumWorld.y),
			depth: Math.sqrt(maximumWorld.z * maximumWorld.z + minimumWorld.z * minimumWorld.z)
		};
	}*/

}
