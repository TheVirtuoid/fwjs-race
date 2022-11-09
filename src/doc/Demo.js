class Demo {

	#canvas
	#changeCallback
	#drawCallback
	#error
	#errorMsg
	#hasError
	#id
	#inputs
	#panel
	#root

	get canvas() { return this.#canvas }
	get drawCallback() { return this.#drawCallback }
	get hasError() { return this.#hasError }
	get height() { return this.#canvas.height }
	get inputs() { return this.#inputs }
	get root() { return this.#root }
	get width() { return this.#canvas.width }

	constructor(id, drawCallback, changeCallback) {
		this.#id = id;
		this.#drawCallback = drawCallback;
		this.#changeCallback = changeCallback;

		this.#root = document.getElementById(id);
		this.#canvas = this.#root.querySelector("canvas");
		this.#panel = this.#root.querySelector(".panel");
		this.#error = this.#root.querySelector(".error");

		// TODO: This should be controlled through css. However, the
		// css is incorrectly implemented so this is necessary for now.
		const size = Math.max(this.height, this.width);
		this.#canvas.height = size;
		this.#canvas.width = size;

		this.#inputs = {};
		this.#addInputs(".coord", (input) => {
			input.max = 10;
			input.min = -10;
			input.step = 0.001;
		});
		this.#addInputs(".posNumber", (input) => {
			input.max = 10;
			input.min = 0;
			input.step = 0.001;
		});

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

	#addInputs(selector, init) {
		const prefixLength = this.#id.length + 1;
		const inputs = this.#panel.querySelectorAll(selector);
		for (let input of inputs) {
			if (init) init(input);
			input.addEventListener("change", this.#changeCallback);
			const suffix = input.id.slice(prefixLength);
			this.#inputs[suffix] = input;
		}
	}
}

export default Demo
