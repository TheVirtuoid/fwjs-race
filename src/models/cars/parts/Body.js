import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";
import {carDefaults} from "../carBase-defaults";
import Part from "./Part";

const defaults = {
	depth: carDefaults.depth,
	height: carDefaults.height,
	width: carDefaults.width,
	mass: 200,
	friction: 0,
	restitution: 0
}
export default class Body extends Part {
	#color;
	constructor(args) {
		super(defaults, args);
		const { color } = args;
		this.#color = color;
	}

	build(args) {
		return this.addModel(args);
	}

	addModel(args) {
		const { scene, position } = args;
		const faceColors = new Array(6).fill(this.color);
		const { depth, height, width, name } = this;
		const box = MeshBuilder.CreateBox(`${name}-box`, { depth, height, width, faceColors }, scene);
		box.position = position.clone();
		box.position.y += height / 2;
		box.isVisible = true;
		this.mesh = box;
		return this;
	}

	applyPhysics() {
		this.mesh.physicsImpostor = new PhysicsImpostor(
				this.mesh, PhysicsImpostor.NoImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		return this;
	}
}