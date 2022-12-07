import styles from "../../css/fwjs-race.pcss";
import CarService from "./CarService";

const carData = [
	{ name: 'Green Ghost', color: '#00ff00', id: 'green-ghost', model: 'LowPolyCar' },
	{ name: 'Red Ranger', color: '#ff0000', id: 'red-ranger', model: 'LowPolyCar' },
	{ name: 'Blue Bull', color: '#0000ff', id: 'blue-bull', model: 'LowPolyCar' },
	{ name: 'Yellow Yak', color: '#ffff00', id: 'yellow-yak', model: 'LowPolyCar' },
	{ name: 'Pink Piranha ', color: '#ff00ff', id: 'pink-piranha', model: 'LowPolyCar' },
	{ name: 'Cyan Cat', color: '#00ffff', id: 'cyan-cat', model: 'LowPolyCar' },
	{ name: 'White Wallaby', color: '#dddddd', id: 'white-wallaby', model: 'LowPolyCar' },
	{ name: 'Black Bart', color: '#222222', id: 'black-bart', model: 'LowPolyCar' }
];

const carService = new CarService({ carData });

const carList = document.getElementById('car-list');
carService.populateCarList(carList);
