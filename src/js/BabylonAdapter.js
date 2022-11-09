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
		if (!this.#scene && !this.#views) throw new Error("Must invoke createScene or addView first");
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
			if (!view.sibling) {
				view.scene = this.#createScene(view.canvas);
				view.view = this.#engine.registerView(view.canvas);
			}
		}

		// Patch in the siblings
		for (let view of this.#views) {
			if (view.sibling) {
				const sibling = this.#findView(view.sibling);
				if (!sibling.scene) {
					throw new Error(`View ${view.canvas.id} has non-root sibling ${sibling.canvas.id}`);
				}
				const name = BabylonAdaptor.#createUniqueName(view.canvas);
				const camera = BabylonAdaptor.#createCamera(view.canvas, name);
				view.scene = sibling.scene;
				view.view = this.#engine.registerView(view.canvas, camera);
			}
		}

		return this.#views[0].scene;
	}

	destroyMesh(mesh, canvas) {
		if (!this.#scene && !this.#views) throw new Error("Must invoke createScene or createViews first");
		if (mesh) {
			const scene = this.#scene ? this.#scene : this.#findView(canvas).scene;
			scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	}

	disableView(canvas) {
		const view = this.#findView(canvas);
		view.view.enabled = false;
		if (this.#engine.inputElement === canvas) this.#engine.inputElement = null;
		console.log("disableView", this.#engine.inputElement, view);
	}

	enableView(canvas) {
		const view = this.#findView(canvas);
		view.view.enabled = true;
		this.#engine.inputElement = canvas;
		console.log("enableView", this.#engine.inputElement, view);
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

	render(canvas) {
		const scene = canvas ? this.#findView(canvas).scene : this.#scene;
		if (this.#ready && scene.activeCamera) scene.render();
	}

	resize() { if (this.#engine) this.#engine.resize(); }

	setCanvas(id) {
		if (this.#views) throw new Error('Cannot mix setCanvas and addView');
		this.#canvas = document.getElementById(id);
	}

	startRenderLoop() {
		if (!this.#engine) throw new Error("Must invoke createDefaultEngine first");
		this.#engine.runRenderLoop(() => this.#renderLoop());
	}

	static #createCamera(canvas, name) {
		const camera = new ArcRotateCamera(
			'camera-' + name,
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			Vector3.Zero());
		camera.attachControl(canvas, true);
		return camera;
	}

	static #createLight(scene, name) {
		return new HemisphericLight('light-' + name, new Vector3(0, 50, 0), scene);
	}

	#createScene(canvas) {
		const name = BabylonAdaptor.#createUniqueName(canvas.id);
		const scene = new Scene(this.#engine);
		BabylonAdaptor.#createCamera(canvas, name);
		BabylonAdaptor.#createLight(scene, name);
		BabylonAdaptor.#enablePhysics(scene);
		return scene;
	}

	static #createUniqueName(preferred) {
		return preferred ? preferred : crypto.randomUUID();
	}

	static #enablePhysics(scene) {
		scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin());
	}

	#findView(canvas) {
		for (let view of this.#views) {
			if (view.canvas === canvas) return view;
		}
		throw new Error(`Must call addView for canvas ${canvas.id}`);
	}

	#renderLoop() {
		if (!this.#ready) return;
		if (this.#scene && this.#scene.activeCamera) this.#scene.render();
		if (this.#views) {
			for (let view of this.#views) {
				if (!view.sibling && view.scene && view.scene !== this.#scene) view.scene.render();
			}
		}
	}
}

export default BabylonAdaptor