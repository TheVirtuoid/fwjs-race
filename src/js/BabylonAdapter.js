import {
	AmmoJSPlugin, ArcFollowCamera, ArcRotateCamera,
	Engine, FollowCamera,
	HemisphericLight,
	Mesh, MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3,
} from "@babylonjs/core";

import ammo from "ammo.js";

class BabylonAdaptor {

	#canvas;
	#engine;
	#ready;
	#scene;
	#camera;

	createDefaultEngine() {
		if (!this.#canvas) throw new Error("Must invoke setCanvas first");
		this.#engine = new Engine(this.#canvas, true, {
			preserveDrawingBuffer: true,
			stencil: true,
			disableWebGL2Support: false
		});
		return this.#engine;
	}

	createRibbon(name, ribbon, closed, meshOptions) {
		if (!this.#scene) throw new Error("Must invoke createScene first");
		const mesh = MeshBuilder.CreateRibbon(
			name,
			{
				pathArray: ribbon,
				sideOrientation: Mesh.DOUBLESIDE,
				closePath: closed,
			},
			this._scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, this.#scene);
		return mesh;
	}

	createScene() {
		if (!this.#canvas) throw new Error("Must invoke setCanvas first");
		if (!this.#engine) throw new Error("Must invoke createDefaultEngine first");
		this.#scene = new Scene(this.#engine);
/*
		const camera = new FollowCamera('follow-camera', new Vector3(20, 15, 0), this.#scene);
		camera.heightOffset = 10;
		camera.radius = 1;
		camera.rotationOffset = 0;
		camera.cameraAcceleration = 0.005;
		camera.maxCameraSpeed = 10;
*/
		const camera = new ArcRotateCamera(
				"Camera",
				3 * Math.PI / 2,
				3 * Math.PI / 8,
				30,
				Vector3.Zero());
		camera.attachControl(this.#canvas, true);

		const light = new HemisphericLight("hemi", new Vector3(0, 50, 0));
		this.#scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin());
		this.#camera = camera;
		return this.#scene;
	}

	createSphere(name, sphereOptions, impostorOptions) {
		if (!this.#scene) throw new Error("Must invoke createScene first");
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, this.#scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, this.#scene);
		return mesh;
	}

	createVector(u) {return new Vector3(u.x, u.y, u.z) }

	destroyMesh(mesh) {
		if (!this.#scene) throw new Error("Must invoke createScene first");
		if (mesh) {
			this.#scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	}

	async initializePhysics() {
		await ammo.bind(window)();
	}

	ready() {
		if (!this.#scene) throw new Error("Must invoke createScene first");
		this.#ready = true;
	}

	resize() { if (this.#engine) this.#engine.resize(); }

	setCanvas(id) { this.#canvas = document.getElementById(id); }

	get camera () {
		return this.#camera;
	}

	get scene () {
		return this.#scene;
	}

	startRenderLoop() {
		if (!this.#engine) throw new Error("Must invoke createDefaultEngine first");
		this.#engine.runRenderLoop(() => {
			if (this.#ready && this.#scene.activeCamera) {
				this.#scene.render();
			}
		});
	}
}

export default BabylonAdaptor