
class Line {

	#origin;
	#normal;

	constructor(origin, normal) {
		this.#origin = origin;
		this.#normal = normal.normalize();
	}

	get normal() { return this.#normal }
	get origin() { return this.#origin }
}

export default Line