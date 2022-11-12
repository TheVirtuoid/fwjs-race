import styles from "../../css/fwjs-race.pcss";
import CarService from "./CarService";

const carData = [
	{ name: 'Green Ghost', color: '#00ff00', id: 'green-ghost' },
	{ name: 'Red Ranger', color: '#ff0000', id: 'red-ranger' },
	{ name: 'Blue Bull', color: '#0000ff', id: 'blue-bull' },
	{ name: 'Yellow Yak', color: '#ffff00', id: 'yellow-yak' },
	{ name: 'Pink Piranha ', color: '#ff00ff', id: 'pink-piranha' },
	{ name: 'Cyan Cat', color: '#00ffff', id: 'cyan-cat' },
	{ name: 'White Wallaby', color: '#dddddd', id: 'white-wallaby' },
	{ name: 'Black Bart', color: '#222222', id: 'black-bart' }
];

const carService = new CarService({ carData });

const carList = document.getElementById('car-list');
carService.populateCarList(carList);

/*
const cars = new Map();
carsData.forEach((carData) => {
	const { name, color, id } = carData;
	const car = new Car({ name, color, id });
	cars.set(id, car);
});

const slotItems = new Map([
	["1", new CarSlotItem({ selector: 'div[data-slot="1"]', cars })],
	["2", new CarSlotItem({ selector: 'div[data-slot="2"]', cars })],
	["3", new CarSlotItem({ selector: 'div[data-slot="3"]', cars })],
	["4", new CarSlotItem({ selector: 'div[data-slot="4"]', cars })],
]);


const listItems = new Map();
const carList = document.getElementById('car-list');
cars.forEach((car, index) => {
	const carListItem = new CarListItem({ car, cars });
	listItems.set(car.id, carListItem);
	carList.appendChild(carListItem.listItem);
});
*/


/*const carSlots = document.getElementById('car-slots');
carSlots.querySelectorAll('div').forEach((slotElement) => {
	slotElement.addEventListener('drop', (event) => {
		const carId = event.dataTransfer.getData('text/plain');
		const liElement = document.getElementById(carId);
		const svgElement = liElement.querySelector('svg');
		const divTarget = event.target;
		while(divTarget.firstChild) {
			divTarget.removeChild(divTarget.firstChild);
		}
		divTarget.appendChild(svgElement);
		const cancelCarElement = document.createElement('span');
		cancelCarElement.setAttribute('data-id', carId);
		cancelCarElement.innerHTML = '&#x274c;';
		cancelCarElement.addEventListener('click', (event) => {
			const svgElement = event.target.previousElementSibling;
			console.log(svgElement);
		});
		divTarget.appendChild(cancelCarElement);
		liElement.classList.add('hidden');
	});
	slotElement.addEventListener('dragover', (event) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	});
});*/
