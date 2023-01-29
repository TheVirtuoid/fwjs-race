import CarBase from "./../cars/CarBase.js";
import {MeshBuilder, PhysicsImpostor, SceneLoader, Vector3} from "@babylonjs/core";
import "@babylonjs/loaders";
import Body from "../cars/parts/Body";

class FerrariBody extends Body {

	constructor(args) {
		super(args);
	}

	addModel(args) {
		const { position } = args;
		const body = this.model.meshes[0];
		body.position = position.clone();
		body.position.y -= .5;
		body.position.x -= .2;
		body.rotate(new Vector3(0, 1, 0), -90 * Math.PI / 180);
		body.scaling.scaleInPlace(2.25);
		body.isVisible = true;
		this.mesh = body;

		const { depth, height, width, name, scene } = this;

		const colliderMesh = MeshBuilder.CreateBox(`${name}-body-collider`, { depth, height: height - .25, width: width + 1.75 }, scene);
		colliderMesh.position = position.clone();
		colliderMesh.position.y += height * .25;
		colliderMesh.position.x -= .3;
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
export default class Ferrari extends CarBase {
	constructor(args) {
		super({ ...args, ...{ BodyFactory: FerrariBody } });
		this.model.meshes[9].material.albedoColor = this.color;
		this.setTelemetryMesh(this.model.meshes[9]);
		// this.model.meshes[0].scaling.scaleInPlace(2.2);
	}

	/*setModelSize(boundingVectors) {
		const { maximumWorld, minimumWorld } = this.model.meshes[9].getBoundingInfo().boundingBox;
		this.modelSize = {
			width: Math.sqrt(maximumWorld.x * maximumWorld.x + minimumWorld.x * minimumWorld.x),
			height: Math.sqrt(maximumWorld.y * maximumWorld.y + minimumWorld.y * minimumWorld.y),
			depth: Math.sqrt(maximumWorld.z * maximumWorld.z + minimumWorld.z * minimumWorld.z)
		};
	}*/

	static Load(scene) {
		return SceneLoader.ImportMeshAsync(null, '/models/', 'Ferarri.glb', scene);
	}
}
