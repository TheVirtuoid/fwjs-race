import {MeshBuilder} from "@babylonjs/core";

const defaults = {
	depth: 1,
	height: 1,
	width: 1,
	mass: 200,
	friction: 0,
	restitution: 0
}
export default class Body extends Part {
	#color;
	constructor(args) {
		const { carDepth = 1, carWidth = 1, carHeight = 1 } = args;
		defaults.depth *= carDepth;
		defaults.width *= carWidth;
		defaults.height *= carHeight;
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
		box.position.y += .25;
		box.isVisible = true;
		this.part = box;
		return box;
	}
}