import styles from "../../css/fwjs-race.pcss";
import Car from "./Car";
import CarListItem from "./CarListItem";
import CarSlotItem from "./CarSlotItem";

const carsData = [
	{ name: 'Green Ghost', color: '#00ff00', id: 'green-ghost' },
	{ name: 'Red Ranger', color: '#ff0000', id: 'red-ranger' },
	{ name: 'Blue Bull', color: '#0000ff', id: 'blue-bull' },
	{ name: 'Yellow Yak', color: '#ffff00', id: 'yellow-yak' },
	{ name: 'Pink Piranha ', color: '#ff00ff', id: 'pink-piranha' },
	{ name: 'Cyan Cat', color: '#00ffff', id: 'cyan-cat' },
	{ name: 'White Wallaby', color: '#dddddd', id: 'white-wallaby' },
	{ name: 'Black Bart', color: '#222222', id: 'black-bart' }
];

const listItems = new Map();
const slotItems = new Map([
	["1", new CarSlotItem({ selector: 'div[data-slot="1"]' })],
	["2", new CarSlotItem({ selector: 'div[data-slot="2"]' })],
	["3", new CarSlotItem({ selector: 'div[data-slot="3"]' })],
	["4", new CarSlotItem({ selector: 'div[data-slot="4"]' })],
]);

const cars = carsData.map((carData) => {
	const { name, color, id } = carData;
	return new Car({ name, color, id });
});

const carList = document.getElementById('car-list');
cars.forEach((car, index) => {
	const carListItem = new CarListItem({ car });
	listItems.set(car.id, carListItem);
	carList.appendChild(carListItem.listItem);
});


const carSlots = document.getElementById('car-slots');
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
});
