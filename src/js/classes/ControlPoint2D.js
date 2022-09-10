import {Vector3} from "@babylonjs/core";

export default class ControlPoint2D {
	#value;
	#forwardDirectionVector;
	#forwardDirectionWeight;
	#backwardDirectionWeight;

	constructor(args = {}) {
		const {
			value = null,
			forwardDirectionVector = null,
			forwardDirectionWeight = null,
			backwardDirectionWeight = null
		} = args;

		if (typeof value !== 'number') {
			throw new TypeError('value must be present and be a number.');
		}

		if (!(forwardDirectionVector instanceof Vector3)) {
			throw new TypeError('forwardDirectionVector must be present and be a Vector3');
		}

		this.#value = value;
		this.#forwardDirectionVector = forwardDirectionVector;
		this.#forwardDirectionWeight = forwardDirectionWeight;
		this.#backwardDirectionWeight = backwardDirectionWeight;
	}

	get value () {
		return this.#value;
	}

	get forwardDirectionVector () {
		return this.#forwardDirectionVector;
	}

	get forwardDirectionWeight () {
		return this.#forwardDirectionWeight;
	}

	get backwardDirectionWeight () {
		return this.#backwardDirectionWeight;
	}

}