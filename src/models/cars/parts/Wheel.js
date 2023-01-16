import {MeshBuilder, StandardMaterial, Texture} from "@babylonjs/core";
import Part from "./Part";

const defaults = {
	diameter: 1.5,
	height: 1,
	mass: 23,
	friction: 50,
	restitution: 0
};
export default class Wheel extends Part {

	#diameter = defaults.diameter;
	constructor(args) {
		super(defaults, args);
		const { diameter } = args;
		this.#diameter = diameter ?? this.#diameter;
	}

	get diameter () {
		return this.#diameter;
	}

	build(args) {
		const { scene, position, wheelName, pivot } = args;
		const wheel = MeshBuilder.CreateSphere(`${this.name}-wheel-${wheelName}`, {
			diameterX: this.diameter,
			diameterY: this.diameter / 2,
			diameterZ: this.diameter
		}, scene);
		wheel.material = new StandardMaterial(`${name}-wheelmat-${wheelName}`, scene);
		wheel.material.diffuseTexture = new Texture("https://i.imgur.com/JbvoYlB.png", scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		wheel.isVisible = false;
		this.part = wheel;
		return { part: this.part, pivot };
	}
}