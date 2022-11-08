class Demo {

	#canvas
	#drawCallback
	#error
	#errorMsg
	#hasError
	#id
	#panel
	#points
	#root

	get canvas() { return this.#canvas }
	get drawCallback() { return this.#drawCallback }
	get hasError() { return this.#hasError }
	get height() { return this.#canvas.height }
	get points() { return this.#points }
	get width() { return this.#canvas.width }

	constructor(id, drawCallback, coordCallback) {
		this.#id = id;
		this.#drawCallback = drawCallback;

		this.#root = document.getElementById(id);
		this.#canvas = this.#root.querySelector("canvas");
		this.#panel = this.#root.querySelector(".panel");
		this.#error = this.#root.querySelector(".error");

		const size = Math.max(this.height, this.width);
		this.#canvas.height = size;
		this.#canvas.width = size;

		const coords = this.#panel.querySelectorAll(".coord");
		for (let coord of coords) {
			coord.max = 10;
			coord.min = -10;
			coord.step = 0.001;
			coord.maxLength = 7;
			if (coordCallback) coord.addEventListener("change", coordCallback);
		}

		this.#points = {};
		const prefixLength = id.length + 1;
		for (let coord of coords) {
			const suffix = coord.id.slice(prefixLength);
			this.#points[suffix] = coord;
		}

		this.clearError();
	}

	clearError() {
		this.#error.classList.add("hidden");
		this.#hasError = false;
	}

	queryInput(suffix) {
		return this.#panel.querySelector('#' + this.#id + '-' + suffix);
	}

	setError(message) {
		if (!this.#errorMsg) this.#errorMsg = this.#error.querySelector(".msg")
		this.#errorMsg.innerText = message;
		this.#error.classList.remove("hidden");
	}
}

export default Demo
