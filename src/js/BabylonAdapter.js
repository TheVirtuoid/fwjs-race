import {
	AmmoJSPlugin, ArcRotateCamera,
	Engine,
	HemisphericLight,
	Mesh, MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3,
} from "@babylonjs/core";

import ammo from "ammo.js";

class BabylonAdaptor {

	#canvas;
	#views;
	#engine;
	#ready;
	#scene;

	addView(canvas, sibling) {
		if (this.#canvas) throw new Error('Cannot mix setCanvas and addView');
		if (!this.#views) this.#views = [];
		this.#views.push({ canvas, sibling });
	}

	createDefaultEngine() {
		if (!this.#canvas && !this.#views) throw new Error("Must invoke setCanvas or addView first");

		const canvas = this.#canvas ? this.#canvas : this.#views[0].canvas;
		this.#engine = new Engine(canvas, true, {
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
		this.#scene = this.#createScene(this.#canvas);
		return this.#scene;
	}

	createSphere(name, sphereOptions, impostorOptions) {
		if (!this.#scene) throw new Error("Must invoke createScene first");
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, this.#scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, this.#scene);
		return mesh;
	}

	createVector(u) {return new Vector3(u.x, u.y, u.z) }

	createViews() {
		if (!this.#views) throw new Error("Must invoke addView first");
		if (!this.#engine) throw new Error("Must invoke createDefaultEngine first");

		// Create scenes for root views
		for (let view of this.#views) {
			if (!view.sibling) view.scene = this.#createScene(view.canvas);
		}

		// Patch in the siblings
		for (let view of this.#views) {
			if (view.sibling) {
				const sibling = this.#findView(view.sibling);
				if (!sibling.scene) {
					throw new Error(`View ${view.canvas.id} has non-root sibling ${sibling.canvas.id}`);
				}
				view.scene = sibling.scene;
			}
		}

		return this.#views[0].scene;
	}

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
		if (!this.#scene && !this.#views && !this.#views[0].scene) {
			throw new Error("Must invoke createScene or createViews first");
		}
		this.#ready = true;
	}

	resize() { if (this.#engine) this.#engine.resize(); }

	setCanvas(id) {
		if (this.#views) throw new Error('Cannot mix setCanvas and addView');
		this.#canvas = document.getElementById(id);
	}

	startRenderLoop() {
		if (!this.#engine) throw new Error("Must invoke createDefaultEngine first");
		this.#engine.runRenderLoop(() => {
			if (this.#ready && this.#scene.activeCamera) {
				this.#scene.render();
			}
		});
	}

	#createScene(canvas) {
		const scene = new Scene(this.#engine);
		const camera = new ArcRotateCamera(
			'camera-' + canvas.id,
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			Vector3.Zero());
		camera.attachControl(canvas, true);
		const light = new HemisphericLight('light-' + canvas.id, new Vector3(0, 50, 0), scene);
		scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin());
		return scene;
	}

	#findView(canvas) {
		for (let view in this.#views) {
			if (view.canvas === canvas) return view;
		}
		throw new Error(`Must call addView for canvas ${canvas.id}`);
	}
}

export default BabylonAdaptor