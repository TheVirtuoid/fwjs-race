export default class Track {
	#controlPoints;
	#trackWidth;
	#wallHeight;

	constructor(args = {}) {
		const { controlPoints = [], trackWidth = null, wallHeight = null } = args;

		if (controlPoints.length < 2) {
			throw new RangeError('You must have at least 2 ControlPoint3D instances.');
		}

		this.#controlPoints = controlPoints;
		this.#trackWidth = trackWidth;
		this.#wallHeight = wallHeight;
	}

	get controlPoints () {
		return this.#controlPoints;
	}

	get trackWidth () {
		return this.#trackWidth;
	}

	get wallHeight () {
		return this.#wallHeight;
	}
}