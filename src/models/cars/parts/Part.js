export default class Part {
	#height;
	#depth;
	#width;
	#mass;
	#zeroMass;
	#friction;
	#restitution;
	#name;
	#part;

	constructor(defaults, args) {
		const { height, depth, width, mass, friction, restitution, zeroMass = false, name } = args;
		this.#height = defaults.height ?? height;
		this.#depth = defaults.depth ?? depth;
		this.#width = defaults.width ?? width;
		this.#mass = defaults.mass ?? mass;
		this.#zeroMass = zeroMass;
		this.#friction = defaults.friction ?? friction;
		this.#restitution = defaults.restitution ?? restitution;
		this.#name = name;
		this.#part = null;
	}

	build () {}

	get height() {
		return this.#height;
	}

	get depth() {
		return this.#depth;
	}

	get width() {
		return this.#width;
	}

	get mass() {
		return this.#zeroMass ? 0 : this.#mass;
	}

	get zeroMass() {
		return this.#zeroMass;
	}

	set zeroMass(setting) {
		this.#zeroMass = !!setting;
	}

	get friction() {
		return this.#friction;
	}

	get restitution() {
		return this.#restitution;
	}

	get part() {
		return this.#part;
	}

	set part(part) {
		this.#part = part;
	}

	get name() {
		return this.#name;
	}

}