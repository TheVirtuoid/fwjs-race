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

	constructor(args = {}) {
		const { carData } = args;
		this.#carData = carData;
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
			const carListItem = new CarListItem({ car });
			listItems.set(car.id, carListItem);
		});
		this.#listItems = listItems;
	}

	#createCarSlots(numberOfSlots) {
		const slots = new Map();
		for(let i = 1; i <= numberOfSlots; i++) {
			const slot = new CarSlotItem({ selector: `div[data-slot="${i}"]` });
			slots.set(i, slot);
		}
		this.#carSlots = slots;
	}


}