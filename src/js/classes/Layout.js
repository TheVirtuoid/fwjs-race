import LayoutSettings from "./LayoutSettings";

export default class Layout {
	#name;
	#settings;
	#segments;

	constructor(args = {}) {
		const {
			name = '',
			settings = new LayoutSettings().toObject(),
			segments = []
		} = args;
		this.#name = name;
		this.#settings = settings;
		this.#segments = segments;
	}

	get name() {
		return this.#name;
	}

	get settings() {
		return this.#settings;
	}

	get segments() {
		return this.#segments;
	}

	addSegment(points) {
		this.#segments.push(points);
	}
}