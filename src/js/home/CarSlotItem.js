export default class CarSlotItem {
	#dom;
	#car = null;

	constructor(args = {}) {
		const { domSelector } = args;
		this.#dom = document.querySelector(domSelector);
		this.#dom.addEventListener('drop', this.#drop.bind(this));
		this.#dom.addEventListener('dragover', this.#dragOver.bind(this));
	}

	addCar(car) {
		while (this.#dom.firstChild) {
			this.#dom.removeChild(this.#dom.firstChild);
		}
		this.#dom.appendChild(car.carImage)
		const cancelCarElement = document.createElement('span');
		cancelCarElement.setAttribute('data-id', car.id);
		cancelCarElement.innerHTML = '&#x274c;';
		cancelCarElement.addEventListener('click', (event) => {
			const svgElement = event.target.previousElementSibling;
			console.log(svgElement);
		});
		this.#dom.appendChild(cancelCarElement);
	}

	get slot () {
		return this.#dom;
	}

	#drop (event) {
		const carId = event.dataTransfer.getData('text/plain');
		const liElement = document.getElementById(carId);
	}

	#dragOver (event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}
}