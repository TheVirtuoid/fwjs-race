import is from './is.js'

class View {

	#canvas
	#sibling

	get canvas() { return this.#canvas }
	get isPrimary() { return !this.#sibling }
	get isSecondary() { return Boolean(this.#sibling) }
	get sibling() { return this.#sibling; }

	constructor(engineAdapter, canvas, sibling) {
		this.#canvas = is.string(canvas) ? document.getElementById(canvas) : canvas;
		this.#sibling = sibling ?
			(is.string(sibling) ? document.getElementById(sibling) : sibling) :
			sibling;

		engineAdapter.addView(this);
	}
}

export default View;
