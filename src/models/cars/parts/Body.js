import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";
import {carDefaults} from "../carBase-defaults";
import Part from "./Part";

const defaults = {
	depth: carDefaults.depth,
	height: carDefaults.height,
	width: carDefaults.width,
	mass: 2000,
	friction: 0,
	restitution: 0
}
export default class Body extends Part {
	#color;

	#model;

	constructor(args) {
		super(defaults, args);
		const { color, model = null } = args;
		this.#color = color;
		this.#model = model;
	}

	build(args) {
		return this.addModel(args);
	}

	get model() {
		return this.#model;
	}

	addModel(args) {
		const { scene, position } = args;
		const faceColors = new Array(6).fill(this.color);
		const { depth, height, width, name } = this;
		const box = MeshBuilder.CreateBox(`${name}-body`, { depth, height, width, faceColors }, scene);
		box.position = position.clone();
		box.position.y += height / 2;
		box.isVisible = true;
		this.mesh = box;
		return this;
	}

	applyPhysics() {
		this.mesh.physicsImpostor = new PhysicsImpostor(
				this.mesh, PhysicsImpostor.BoxImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		return this;
	}
}