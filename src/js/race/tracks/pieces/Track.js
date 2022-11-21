export default class Track {
	#segments;
	#options;

	constructor(options = {}) {
		this.#segments = [];
		this.#options = options;
	}

	addSegment(segment) {
		this.#segments.push(segment);
		return this.#segments.at(-1);
	}

	toObject() {
		return {
			segments: this.#segments,
			options: this.#options
		}
	}
}