export default class Point {

	#backwardWeight = 1;
	#center;
	#forward;
	#forwardWeight = 1;

	constructor(args = {}) {
		const { backwardWeight, center, forward, forwardWeight } = args;
		this.#backwardWeight = backwardWeight;
		this.#center = center;
		this.#forward = forward;
		this.#forwardWeight = forwardWeight;
	}

	get center() {
		return this.#center;
	}

}