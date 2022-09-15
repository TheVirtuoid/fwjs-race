import Validate from "./Validate";

export default class Vector {
	#x;
	#y;
	#z;

	constructor(args = {}) {
		const { x, y, z } = args;
		this.#x = x;
		this.#y = y;
		this.#z = z;
	}

	get x() {
		return this.#x;
	}

	get y() {
		return this.#y;
	}

	get z() {
		return this.#z;
	}

	set x(value) {
		Validate.checkForNumber('Vector.x', value);
		this.#x = value;
	}

	set y(value) {
		Validate.checkForNumber('Vector.y', value);
		this.#y = value;
	}

	set z(value) {
		Validate.checkForNumber('Vector.z', value);
		this.#z = value;
	}
}