export default class CarSlotItem {
	#dom;
	#carId;
	#deleteIcon;
	#carSlots = document.getElementById('car-slots');
	#service;

	constructor(args = {}) {
		const { selector, service } = args;
		this.#dom = this.#carSlots.querySelector(selector);
		this.#dom.addEventListener('drop', this.#drop.bind(this));
		this.#dom.addEventListener('dragover', this.#dragOver.bind(this));
		this.#deleteIcon = this.#dom.querySelector('span');
		this.#deleteIcon.addEventListener('click', this.#removeCar.bind(this));
		this.#service = service;
	}

	addCar(car) {
		if (this.#carId) {
			this.#removeCar();
		}
		this.#carId = car.id;
		this.#dom.prepend(car.carImage)
		this.#deleteIcon.setAttribute('data-id', car.id);
		this.#deleteIcon.classList.remove('hidden');
	}

	get carId () {
		return this.#carId;
	}

	#drop (event) {
		const carId = event.dataTransfer.getData('text/plain');
		const car = this.#service.getCar(carId);
		this.addCar(car);
		this.#service.removeCarFromList(carId);
	}

	#dragOver (event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	#removeCar(event) {
		const carId = this.#carId;
		this.#deleteIcon.classList.add('hidden');
		this.#carId = null;
		this.#service.addCarToList(carId);
	}

	toObject() {
		return {
			carId: this.#carId
		}
	}
}