import {MeshBuilder} from "@babylonjs/core";

const defaults = {
	depth: .1,
	width: .1,
	height: .25,
	mass: 1302,
	friction: 5,
	restitution: 0
}
export default class Transmission extends Part {
	constructor(args) {
		const { carDepth = 1, carWidth = 1, carHeight = 1 } = args;
		defaults.depth *= carDepth;
		defaults.width *= carWidth;
		defaults.height *= carHeight;
		super(defaults, args);
	}
	build (args) {
		const { scene, position } = args;
		const { depth, width, height } = this;
		const wheelBase = MeshBuilder.CreateBox(`${name}-wheelbase`, { depth, width, height }, scene);
		wheelBase.rotation.x = Math.PI / 2;
		wheelBase.position = position.clone();
		wheelBase.isVisible = false;
		this.part = wheelBase;
		return wheelBase;
	}
}