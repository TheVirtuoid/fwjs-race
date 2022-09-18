import Validate from "./Validate";
import Vector from "./Vector";
import { normalizeDegrees } from "./Util";


export default class ControlPoint {

	// Vectors
	#center;
	#forward;

	// Positive numbers
	#forwardWeight;
	#backwardWeight;
	#trackWidth;
	#wallHeight;

	// Angles (degrees)
	#trackBank;

	constructor(params = {}) {
		const {
			center,
			forward = { x: 1, y: 0, z: 0 },
			forwardWeight = 1,
			backwardWeight = 1,
			trackWidth = null,
			wallHeight = null,
			trackBank = null
		} = params;

		// NOTE: Use the setters to validate the values
		this.center = center;
		this.forward = forward;
		this.forwardWeight = forwardWeight;
		this.backwardWeight = backwardWeight;
		this.trackWidth = trackWidth;
		this.wallHeight = wallHeight;
		this.trackBank = trackBank;
	}

	get center() { return this.#center; }
	get forward() { return this.#forward; }
	get forwardWeight() { return this.#forwardWeight; }
	get backwardWeight() { return this.#backwardWeight; }
	get trackBank() { return this.#trackBank; }
	get trackWidth() { return this.#trackWidth; }
	get wallHeight() { return this.#wallHeight; }

	set center(value) {
		Validate.checkForVector("center", value);
		this.#center = value;
	}

	set forward(value) {
		Validate.checkForVector("forward", value);
		this.#forward = value;
	}

	set forwardWeight(value) {
		Validate.checkForPositiveNumber("forwardWeight", value);
		this.#forwardWeight = value;
	}

	set backwardWeight(value) {
		Validate.checkForPositiveNumber("backwardWeight", value);
		this.#backwardWeight = value;
	}

	set trackWidth(value) {
		if (value !== null) {
			Validate.checkForPositiveNumber("trackWidth", value);
		}
		this.#trackWidth = value;
	}

	set wallHeight(value) {
		if (value !== null) {
			Validate.checkForPositiveNumber("wallHeight", value);
		}
		this.#wallHeight = value;
	}

	set trackBank(value) {
		if (value !== null) {
			Validate.checkForNumber("trackBank", value);
		}
		this.#trackBank = normalizeDegrees(value);
	}
}