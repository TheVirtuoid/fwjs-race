export default class LayoutSettings {
	#precision;
	#trackBank;
	#trackWidth;
	#wallHeight;
	#backwardWeight;
	#forwardWeight;

	constructor(args = {}) {
		const {
			precision = .01,
			trackBank = 0,
			trackWidth = 1,
			wallHeight = .5,
			backwardWeight = .5,
			forwardWeight = .5
		} = args;
		this.#precision = precision;
		this.#trackBank = trackBank;
		this.#trackWidth = trackWidth;
		this.#wallHeight = wallHeight;
		this.#backwardWeight = backwardWeight;
		this.#forwardWeight = forwardWeight;
	}

	toObject() {
		return {
			precision: this.precision,
			trackBank: this.trackBank,
			trackWidth: this.trackWidth,
			wallHeight: this.wallHeight,
			backwardWeight: this.backwardWeight,
			forwardWeight: this.forwardWeight
		}
	}

	get precision() {
		return this.#precision;
	}

	get trackBank() {
		return this.#trackBank;
	}

	get trackWidth() {
		return this.#trackWidth;
	}

	get wallHeight() {
		return this.#wallHeight;
	}

	get backwardWeight() {
		return this.#backwardWeight;
	}

	get forwardWeight() {
		return this.#forwardWeight;
	}
}