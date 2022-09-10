import {Vector3} from "@babylonjs/core";

export default class ControlPoint3D {
	#locationVector;
	#forwardDirectionVector;
	#forwardDirectionWeight;
	#backwardDirectionWeight;
	#trackWidth;
	#bankAngle;
	#wallHeight;
	#name;

	constructor(args = {}) {
		const {
			locationVector = null,
			forwardDirectionVector = null,
			forwardDirectionWeight = 1,
			backwardDirectionWeight = 1,
			trackWidth = null,
			bankAngle = null,
			wallHeight = null,
			name = null
		} = args;

		if (!(locationVector instanceof Vector3)) {
			throw new TypeError('locationVector must be specified and be a Vector3');
		}
		if (!(forwardDirectionVector instanceof Vector3)) {
			throw new TypeError('forwardDirectionVector must be specified and be a Vector3');
		}
		this.#locationVector = locationVector;
		this.#forwardDirectionVector = forwardDirectionVector;
		this.#forwardDirectionWeight = forwardDirectionWeight;
		this.#backwardDirectionWeight = backwardDirectionWeight;
		this.#trackWidth = trackWidth;
		this.#bankAngle = bankAngle;
		this.#wallHeight = wallHeight;
		this.#name = name;
	}

	get locationVector () {
		return this.#locationVector;
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

	get trackWidth () {
		return this.#trackWidth;
	}

	get bankAngle () {
		return this.#bankAngle;
	}

	get wallHeight () {
		return this.#wallHeight;
	}

	get name () {
		return this.#name;
	}

}