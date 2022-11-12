export default class CarSlotItem {
	#dom;
	#car = null;
	#deleteIcon;
	#carSlots = document.getElementById('car-slots');

	constructor(args = {}) {
		const { selector } = args;
		this.#dom = this.#carSlots.querySelector(selector);
		this.#dom.addEventListener('drop', this.#drop.bind(this));
		this.#dom.addEventListener('dragover', this.#dragOver.bind(this));
		this.#deleteIcon = this.#dom.querySelector('span');
		this.#deleteIcon.addEventListener('click', this.#removeCar.bind(this));
	}

	addCar(car) {
		this.#dom.prepend(car.carImage)
		this.#deleteIcon.setAttribute('data-id', car.id);
		this.#deleteIcon.classList.remove('hidden');
	}

	get slot () {
		return this.#dom;
	}

	#drop (event) {
		const carId = event.dataTransfer.getData('text/plain');

		/*const car = this.#cars.get(carId);
		this.addCar(car);*/
	}

	#dragOver (event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	#removeCar(event) {
		console.log(event);
	}
}