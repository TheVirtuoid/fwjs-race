import {MeshBuilder, PhysicsImpostor} from "@babylonjs/core";
import {carDefaults} from "../carBase-defaults";
import Part from "./Part";

const defaults = {
	depth: carDefaults.depth * .1,
	width: carDefaults.width * .1,
	height: carDefaults.height * .25,
	mass: 1302,
	friction: 5,
	restitution: 0
}
export default class Transmission extends Part {
	constructor(args) {
		super(defaults, args);
	}
	build (args) {
		const { scene, position } = args;
		const { depth, width, height } = this;
		const wheelBase = MeshBuilder.CreateBox(`${name}-wheelbase`, { depth, width, height }, scene);
		wheelBase.rotation.x = Math.PI / 2;
		wheelBase.position = position.clone();
		wheelBase.isVisible = true;
		this.mesh = wheelBase;
		return this;
	}

	applyPhysics() {
		this.mesh.physicsImpostor = new PhysicsImpostor(
				this.mesh,
				PhysicsImpostor.CylinderImpostor, {
					mass: this.mass,
					friction: this.friction,
					restitution: this.restitution
				});
		return this;
	}
}