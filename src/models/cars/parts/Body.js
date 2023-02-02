import {MeshBuilder, PhysicsImpostor, Vector3} from "@babylonjs/core";
import {carDefaults} from "../carBase-defaults";
import Part from "./Part";

const defaults = {
	depth: carDefaults.depth,
	height: carDefaults.height,
	width: carDefaults.width,
	mass: 1000,
	friction: 0,
	restitution: 0
};

const toRadians = (degrees) => {
	return degrees * Math.PI / 180;
};

export default class Body extends Part {
	#color;

	#model;

	#colliderMesh;

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

	get colliderMesh() {
		return this.#colliderMesh;
	}

	addModel(args) {
		const { scene, position } = args;
		const faceColors = new Array(6).fill(this.color);
		const { depth, height, width, name } = this;
		const box = MeshBuilder.CreateBox(`${name}-body`, { depth: depth, height, width: width * .75, faceColors }, scene);
		box.position = position.clone();
		box.position.y += height / 2;
		box.isVisible = true;
		// box.showBoundingBox = true;
		this.mesh = box;
		// this.addColliderMesh(args);
		return this;
	}

	addColliderMesh(args) {
		const { scene, position } = args;
		const { depth, height, width, name } = this;
		const cylinder = MeshBuilder.CreateCylinder(`${name}-cylinder`, {
			height: width,
			diameter: .25,
			enclose: true
		}, scene);
		cylinder.position = position.clone();
		cylinder.rotate(new Vector3(0, 0, 1), toRadians(90));
		cylinder.showBoundingBox = true;
		cylinder.physicsImpostor = new PhysicsImpostor(cylinder, PhysicsImpostor.CylinderImpostor, { mass: 1 }, scene);
		this.colliderMesh = cylinder;
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