import {MeshBuilder, PhysicsImpostor, StandardMaterial, Texture} from "@babylonjs/core";
import Part from "./Part";
import {carDefaults} from "../carBase-defaults";
const defaults = {
	diameter: carDefaults.height *.75,
	mass: 20,
	friction: 50,
	restitution: 0,
	textureUrl: 'https://i.imgur.com/JbvoYlB.png'
};
export default class Wheel extends Part {

	#diameter = defaults.diameter;
	#textureUrl = defaults.textureUrl;

	#pivot;

	#wheelName;
	constructor(args) {
		super(defaults, args);
		const { diameter, textureUrl, pivot, wheelName } = args;
		this.#diameter = diameter ?? this.#diameter;
		this.#textureUrl = textureUrl ?? this.#textureUrl;
		this.#pivot = pivot;
		this.#wheelName = wheelName;
	}

	get diameter () {
		return this.#diameter;
	}

	get textureUrl () {
		return this.#textureUrl;
	}

	get pivot() {
		return this.#pivot;
	}

	get wheelName() {
		return this.#wheelName;
	}

	build(args) {
		const { scene, position } = args;
		const wheel = MeshBuilder.CreateSphere(`${this.name}-wheel-${this.wheelName}`, {
			diameterX: this.diameter,
			diameterY: this.diameter / 2,
			diameterZ: this.diameter
		}, scene);
		wheel.material = new StandardMaterial(`${this.name}-wheelmat-${this.wheelName}`, scene);
		wheel.material.diffuseTexture = new Texture(this.#textureUrl, scene);
		wheel.rotation.x = Math.PI / 2;
		wheel.position = position.clone();
		this.mesh = wheel;
		return this;
	}

	applyPhysics() {
		this.mesh.physicsImpostor = new PhysicsImpostor(
				this.mesh,
				PhysicsImpostor.SphereImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		return this;
	}
}