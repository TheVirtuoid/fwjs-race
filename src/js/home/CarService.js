import Car from "./Car";
import CarListItem from "./CarListItem";
import CarSlotItem from "./CarSlotItem";

const numberOfSlots = 4;

export default class CarService {

	#listItems;
	#carSlots;
	#carData;
	#cars;
	#numberOfSlots = numberOfSlots;
	#race;

	constructor(args = {}) {
		const { carData } = args;
		this.#carData = carData;
		this.#race = document.getElementById('race');
		this.#createCars(carData);
		this.#createListItems(this.#cars);
		this.#createCarSlots(this.#numberOfSlots);
	}

	populateCarList(listElement) {
		while(listElement.firstChild) {
			listElement.removeChild(listElement.firstChild);
		}
		this.#listItems.forEach((item) => listElement.append(item.listItem));
	}

	getCar(carId) {
		return this.#cars.get(carId);
	}

	removeCarFromList(carId) {
		const listItem = this.#listItems.get(carId);
		listItem.hide();
		this.#activateRace();
	}

	addCarToList(carId) {
		const listItem = this.#listItems.get(carId);
		listItem.show();
		this.#activateRace();
	}

	#createCars (carData) {
		const cars = new Map();
		carData.forEach((carDatum) => {
			const { name, color, id } = carDatum;
			const car = new Car({ name, color, id });
			cars.set(id, car);
		});
		this.#cars = cars;
	}

	#createListItems(cars) {
		const listItems = new Map();
		cars.forEach((car) => {
			const carListItem = new CarListItem({ car, service: this });
			listItems.set(car.id, carListItem);
		});
		this.#listItems = listItems;
	}

	#createCarSlots(numberOfSlots) {
		const slots = new Map();
		for(let i = 1; i <= numberOfSlots; i++) {
			const slot = new CarSlotItem({ selector: `div[data-slot="${i}"]`, service: this });
			slots.set(i, slot);
		}
		this.#carSlots = slots;
	}

	#areSlotsFull() {
		let slotsFull = true;
		this.#carSlots.forEach((slot) => slotsFull &= !!slot.carId);
		return slotsFull;
	}

	#activateRace() {
		if (this.#areSlotsFull()) {
			this.#race.classList.remove('hidden');
		} else {
			this.#race.classList.add('hidden');
		}
	}


}