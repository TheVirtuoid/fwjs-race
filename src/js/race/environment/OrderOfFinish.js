export default class OrderOfFinish {

	#dom;
	#order;

	constructor(args = {}) {
		const { dom } = args;
		this.#dom = document.querySelector(dom);
		this.#order = new Map();
	}

	clear () {
		while (this.#dom.firstChild) {
			this.#dom.removeChild(this.#dom.firstChild);
		}
		this.#order.clear();
	}

	add (car, text) {
		if (!this.#order.get(car.name)) {
			this.#order.set(car.name, car);
			const li = `<li>${text || car.name}</li>`;
			this.#dom.insertAdjacentHTML('beforeend', li);
		}
	}


}