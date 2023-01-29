export default class Part {
	height;
	depth;
	width;
	#mass;
	#zeroMass;
	friction;
	restitution;
	name;
	mesh;
	color;

	constructor(defaults, args) {
		const incomingData = {...defaults, ...args};
		const { height, depth, width, mass, friction, restitution, zeroMass = false, name, color } = incomingData;
		this.height = height;
		this.depth = depth;
		this.width = width;
		this.#mass = mass;
		this.#zeroMass = zeroMass;
		this.friction = friction;
		this.restitution = restitution;
		this.name = name;
		this.mesh = null;
		this.color = color;
	}

	build () {
		return this;
	}

	addModel() {
		return this;
	}

	applyPhysics () {
		return this;
	}

	get mass() {
		return this.#zeroMass ? 0 : this.#mass;
	}
	set zeroMass(setting) {
		this.#zeroMass = !!setting;
	}

	get isBuilt() {
		return !!this.mesh;
	}

	junk(scene) {
		if (this.mesh) {
			scene.removeMesh(this.mesh);
			this.mesh = null;
		}
	}
}