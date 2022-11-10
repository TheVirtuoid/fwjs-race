import {
	AmmoJSPlugin, ArcRotateCamera,
	ArcRotateCameraPointersInput,	// TODO: Remove when finished debugging
	Engine,
	HemisphericLight,
	Mesh, MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3,
} from "@babylonjs/core";

import ammo from "ammo.js";
import is from './is.js'

class SingleSceneManager {

	#canvas
	#scene

	get canvas() { return this.#canvas }
	get scene() { return this.#scene }

	constructor(canvas) {
		this.#canvas = is.string(canvas) ? document.getElementById(canvas) : canvas;
		if (!canvas.debugName) canvas.debugName = canvas.id || crypto.randomUUID();
	}

	create(createScene, registerView) {
		this.#scene = createScene(this.#canvas);
		return this.#scene;
	}

	render() {
		this.#scene.render();
	}
}

const errorSiblingViewCannotHaveSibling = 'Cannot use a view as a sibling if it also has a sibling'
const errorMustInvokeAddViewForSibling = 'Must invoke addView for sibling'

class ViewManager {

	#views

	get canvas() { return this.#views[0].canvas }
	get scene() { return this.#views[0].scene }

	constructor(view) {
		this.#views = [ view ];
	}

	addView(view) {
		this.#views.push(view);
	}

	create(createScene, registerView, createDummyScene) {

		// Create scenes for root views
		for (let view of this.#views) {
			if (view.isPrimary) {
				view.scene = createScene(view.canvas);
				view.view = registerView(view.canvas, view.scene);
				view.scene.detachControl();
			}
		}

		// Patch in the siblings
		for (let view of this.#views) {
			if (view.isSecondary) {
				const sibling = this.#findPrimary(view.sibling);
				if (sibling.isSecondary) throw new Error(errorSiblingViewCannotHaveSibling);
				view.scene = sibling.scene;
				view.view = registerView(view.canvas, view.scene, true);
				view.scene.detachControl();
			}
		}

		return this.#views[0].scene;
	}

	static renderAlgo = 2;

	render(engine) {
		if (ViewManager.renderAlgo === 1) {
			if (!engine.activeView || !engine.activeView.camera) {
				//console.log('ViewManager.render-0', engine.activeView, this.#views[0].scene.debugName, this.#views[0].scene.cameras.length, this.#views[0].scene.cameras[0].id);
				this.#views[0].scene.render();
			} else {
				for (let view of this.#views) {
					if (engine.activeView.target === view.view) {
						console.log('ViewManager.render-1', view.scene.debugName, view.scene.cameras.length, view.scene.cameras[0].id);
						view.scene.render();
						return;
					}
				}
				throw new Error('engine.activeView.target does not match any views');
			}
		}

		else if (ViewManager.renderAlgo === 2) {
			for (let view of this.#views) {
				if (view.isPrimary) {
					//console.log('ViewManager.render', view.scene.debugName, view.scene.cameras.length, view.scene.cameras[0].id);
					view.scene.render();
				}
			}
		}
	}

	#findPrimary(view) {
		for (let v of this.#views) {
			if (v.canvas === view.sibling) return v;
		}
		throw new Error(errorMustInvokeAddViewForSibling);
	}
}

const errorCannotMultipleInvokeCreate = 'Cannot invoke createScene or createViews twice'
const errorCannotMultipleInvokeSetCanvas = 'Cannot invoke setCanvas twice'
const errorCannotMix = 'Cannot mix setCanvas and addView'
const errorMustInvokeCreate = 'Must invoke createScene or createViews first'
const errorMustInvokeCreateEngine = 'Must invoke createDefaultEngine first'
const errorMustInvokeCreateViews = 'Must invoke createViews first'
const errorMustInvokeSetAdd = 'Must invoke setCanvas or addView first'

class BabylonAdaptor {

	#engine;
	#ready;
	#sceneManager;

	addView(view) {
		if (!this.#sceneManager) {
			this.#sceneManager = new ViewManager(view);
		} else if (this.#sceneManager instanceof ViewManager) {
			this.#sceneManager.addView(view);
		} else {
			throw new Error(errorCannotMix);
		}
	}

	createDefaultEngine() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);

		this.#engine = new Engine(
			this.#sceneManager.canvas,
			true,
			{
				preserveDrawingBuffer: true,
				stencil: true,
				disableWebGL2Support: false
			});
		return this.#engine;
	}

	createRibbon(name, ribbon, closed, meshOptions, view) {
		if (view) {
			if (!view.scene) throw new Error(errorMustInvokeCreateViews);
		} else {
			if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
			if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		}

		const scene = view ? view.scene : this.#sceneManager.scene;
		const mesh = MeshBuilder.CreateRibbon(
			name,
			{
				pathArray: ribbon,
				sideOrientation: Mesh.DOUBLESIDE,
				closePath: closed,
			},
			scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, scene);
		return mesh;
	}

	createScene() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (this.#sceneManager.scene) throw new Error(errorCannotMultipleInvokeCreate);

		return this.#sceneManager.create(
			(canvas) => { return this.#createScene(canvas) },
			(canvas, scene, generateCamera) => {
				if (generateCamera) {
					const name = BabylonAdaptor.#createUniqueName(canvas);
					const camera = BabylonAdaptor.#createCamera(canvas, scene, name);
					return this.#engine.registerView(canvas, camera);
				} else {
					return this.#engine.registerView(canvas);
				}
			},
			() => { return new Scene(this.#engine) });
	}

	createScenes() { this.createScene() }

	createSphere(name, sphereOptions, impostorOptions) {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (this.#sceneManager.scene) throw new Error(errorCannotMultipleInvokeCreate);

		const scene = this.#sceneManager.scene;
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, scene);
		return mesh;
	}

	createVector(u) {return new Vector3(u.x, u.y, u.z) }

	createViews() { this.createScene() }

	destroyMesh(mesh, view) {
		if (view) {
			if (!view.scene) throw new Error(errorMustInvokeCreateViews);
		} else {
			if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
			if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		}

		if (mesh) {
			const scene = view ? view.scene : this.#sceneManager.scene;
			scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	}

	// TODO: disableView seems to permenantly disable the view. This may be
	// because there is only one view per scene in the current tests.

	disableView(view) {
		//view.view.enabled = false;
		//view.scene.detachControl();
		//if (this.#engine.inputElement === view.canvas) this.#engine.inputElement = null;
		//console.log("disableView", this.#engine.inputElement);
	}

	enableView(view) {
		view.view.enabled = true;
		view.scene.attachControl();
		this.#engine.inputElement = view.canvas;
	}

	async initializePhysics() {
		await ammo.bind(window)();
	}

	ready() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		this.#ready = true;
	}

	render(view) {
		const scene = view ? view.scene : this.#sceneManager.scene;
		if (this.#ready && scene.activeCamera) scene.render();
	}

	resize() { if (this.#engine) this.#engine.resize(); }

	setCanvas(idOrCanvas) {
		if (!this.#sceneManager) {
			this.#sceneManager = new SingleSceneManager(idOrCanvas);
		} else if (this.#sceneManager instanceof SingleSceneManager) {
			throw new Error(errorCannotMultipleInvokeSetCanvas);
		} else {
			throw new Error(errorCannotMix);
		}
	}

	startRenderLoop() {
		if (!this.#engine) throw new Error(errorMustInvokeCreateEngine);
		this.#engine.runRenderLoop(() => this.#renderLoop());
	}

	static #createCamera(canvas, scene, name) {
		const camera = new ArcRotateCamera(
			'camera-' + name,
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			Vector3.Zero(),
			scene);
		camera.attachControl(canvas, true);
		console.log('#createCamera', camera.id, canvas.debugName, scene.debugName, scene.cameras.length, scene.cameras.indexOf(camera) >= 0);
		return camera;
	}

	static #createLight(scene, name) {
		return new HemisphericLight('light-' + name, new Vector3(0, 50, 0), scene);
	}

	#createScene(canvas) {
		const name = BabylonAdaptor.#createUniqueName(canvas.id);
		const scene = new Scene(this.#engine);
		scene.debugName = 'scene-' + name;
		BabylonAdaptor.#createCamera(canvas, scene, name);
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

	#renderLoop() {
		if (!this.#ready) return;
		this.#sceneManager.render(this.#engine);
	}
}

export default BabylonAdaptor