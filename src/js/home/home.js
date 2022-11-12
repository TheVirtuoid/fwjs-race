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
