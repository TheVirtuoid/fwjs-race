import CarService from "./CarService";
import { tracks } from "../tracks/track.config.js";

const carData = [
	{ name: 'Green Ghost', color: '#00ff00', id: 'green-ghost', model: '' },
	{ name: 'Red Ranger', color: '#ff0000', id: 'red-ranger', model: '' },
	{ name: 'Blue Bull', color: '#0000ff', id: 'blue-bull', model: '' },
	{ name: 'Yellow Yak', color: '#ffff00', id: 'yellow-yak', model: '' },
	{ name: 'Pink Piranha ', color: '#ff00ff', id: 'pink-piranha', model: '' },
	{ name: 'Cyan Cat', color: '#00ffff', id: 'cyan-cat', model: '' },
	{ name: 'White Wallaby', color: '#dddddd', id: 'white-wallaby', model: '' },
	{ name: 'Black Bart', color: '#222222', id: 'black-bart', model: '' }
];

const carService = new CarService({ carData });

const carList = document.getElementById('car-list');
carService.populateCarList(carList);

const selectTrack = document.getElementById('select-track');
while (selectTrack.firstChild) {
	selectTrack.removeChild(selectTrack.firstChild);
}
tracks.forEach((track) => {
	const option = document.createElement('option');
	option.value = track.value;
	option.textContent = track.name;
	selectTrack.append(option);
});


