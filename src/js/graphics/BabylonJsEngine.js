import GraphicsEngineAbstract from "./GraphicsEngineAbstract";
import ammo from "ammo.js";
import {Engine, Scene} from "@babylonjs/core";

export default class BabylonJsEngine extends GraphicsEngineAbstract {

	#physicsLibrary;
	#canvas;
	#engine;
	#scene;
	#cameras = new Map();

	constructor(args = {}) {
		const { canvas } = args;
		super();
		this.#physicsLibrary = (async () => {await ammo.bind(window)()})();
		this.#canvas = canvas;
	}

	createEngine () {
		if (!this.#engine) {
			this.#engine = new Engine(this.#canvas, true);
		}
		return this.#engine;
	}

	createScene () {
		if (!this.#scene) {
			this.#scene = new Scene(this.#engine);
		}
		return this.#scene;
	}

	createCamera (args = {}) {
		const { type, position, pointsTo = this.createVector(0, 0, 0) } = args;

	}

	createLight () {}

	createColor () {}

	createVector () {}

	createMesh () {}

	createMaterial () {}
}