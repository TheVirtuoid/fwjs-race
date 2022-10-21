import NoCanvasSetError from "./errors/NoCanvasSetError";
import {
	AmmoJSPlugin,
	ArcRotateCamera,
	Engine,
	HemisphericLight, Mesh,
	MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3
} from "@babylonjs/core";
import NoSceneSetError from "./errors/NoSceneSetError";
import NoEngineSetError from "./errors/NoEngineSetError";
import ammo from "ammo.js";

let instance;

export default class BabylonEngine {
	#canvas;
	#engine;
	#scene;
	#ammo;
	#ready;

	constructor() {
		if (!instance) {
			(async () => { this.#ammo = await ammo.bind(window)() })();
			this.#ready = false;
			instance = this;
		}
		return instance;
	}

	vector3(...args) {
		return new Vector3(...args);
	}

	createDefaultEngine() {
		this.#validateCanvas();
		// TODO: Need more documentation on 'preserverDrawingBuffer' and 'stencil'
		this.#engine = new Engine(this.#canvas, true, {
			preserveDrawingBuffer: true,
			stencil: true,
			disableWebGL2Support: false
		});
		return this.#engine;
	}

	createRibbon(name, ribbon, closed, meshOptions) {
		this.#validateScene();
		const mesh = MeshBuilder.CreateRibbon(
				name,
				{
					pathArray: ribbon,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					closePath: closed,
				},
				this.#scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, this.#scene);
		return mesh;
	}

	createScene() {
		this.#validateEngine();
		this.#scene = new Scene(this.#engine);
		const camera = new ArcRotateCamera(
				"Camera",
				3 * Math.PI / 2,
				3 * Math.PI / 8,
				30,
				BABYLON.Vector3.Zero());
		camera.attachControl(this.#canvas, true);
		const light = new HemisphericLight("hemi", new Vector3(0, 50, 0), this.#scene);
		this.#scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin(true, this.#ammo));
		return this.#scene;
	}

	createSphere(name, sphereOptions, impostorOptions) {
		this.#validateScene();
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, this.#scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, this.#scene);
		return mesh;
	}

	destroyMesh(mesh) {
		if (mesh instanceof Mesh) {
			const scene = mesh.getScene();
			scene.removeMesh(mesh);
			mesh.dispose();
		}
		// TODO: Not sure why false is returned, just simply return should be sufficient
		return false;
	}

	ready() {
		this.#validateScene();
		this.#ready = true;
	}

	resize() {
		if (this.#engine){
			this.#engine.resize();
		}
	}

	setCanvas(id) {
		this.#canvas = document.getElementById(id);
	}

	startRenderLoop () {
		this.#validateEngine();
		this.#validateScene();
		this.#engine.runRenderLoop(() => {
			if (this.#ready && this.#scene.activeCamera) {
				this.#scene.render();
			}
		});
	}

	#validateScene() {
		if (!this.#scene) {
			throw new NoSceneSetError();
		}
	}

	#validateCanvas() {
		if (!this.#canvas) {
			throw new NoCanvasSetError();
		}
	}

	#validateEngine() {
		if (!this.#engine) {
			throw new NoEngineSetError();
		}
	}
}
