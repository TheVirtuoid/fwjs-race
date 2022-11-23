import styles from "./../../css/race.pcss";

import BabylonAdapter from './utilities/BabylonAdapter.js'

import DebugDisplay from './utilities/DebugDisplay.js'
import ErrorDisplay from './utilities/ErrorDisplay.js'
import TrackDisplay from './utilities/TrackDisplay.js'

import {testTrack} from "./tracks/testtrack";
import Car2 from "./../models/Car2";
import CarOnTrack from "../models/CarOnTrack";
import {Color3} from "@babylonjs/core";
import countdown from "./environment/countdown";

//======================================================================
// WINDOW INITIALIZATION

let debugDisplay;

function registerCallback(track) {
	// debugDisplay.register(track);
}

const scale = .2;
const wheelType = 'ellipse';
const cars = new Map();
const runCars = false;

// Error Display
const errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		'',	// Disable ids
		[]);

// new Car2({ scale: carScale, name: 'Green Ghost', color: new Color3.Green(), wheelType: 'ellipse' }),
let startingCarId = '';
const slots = JSON.parse(sessionStorage.getItem('FWJS-Race'));
slots.forEach((slot) => {
	const { name, id, color } = slot.car;
	cars.set(id, new CarOnTrack({ slot: slot.slot, scale, name, id, color, wheelType }));
	if (slot.slot === 1) {
		startingCarId = id;
	}
});

const gameEngine = new BabylonAdapter();
gameEngine.setCanvas("renderCanvas");

const trackDisplay = new TrackDisplay(
			"trackFamilies", "trackMembers", gameEngine, errorDisplay,
			() => {
				cars.forEach((car) => car.junk());
				}, registerCallback);
		/*document.getElementById('go-car').addEventListener('click', () => {
			const selectedTrack = trackDisplay.getSelectedTrack();
			selectedTrack.gate.dropCars();
			gameEngine.camera.lockedTarget = cars[0].chassis;
		});
		document.getElementById('start').addEventListener('click', () => {
			const selectedTrack = trackDisplay.getSelectedTrack();
			selectedTrack.gate.startRace();
		});*/

const engine = gameEngine.createDefaultEngine();
await gameEngine.initializePhysics();
const scene = gameEngine.createScene();
gameEngine.ready();

testTrack(trackDisplay, cars, scene);
trackDisplay.start();
const selectedTrack = trackDisplay.getSelectedTrack();
selectedTrack.gate.dropCars();
if (runCars) {
	gameEngine.camera.lockedTarget = cars.get(startingCarId).chassis;
}


const leaderBoard = document.getElementById('leader-board');
const renderLoopCallback = () => {
/*
	const list = cars.map((car) => {
		car.setDistanceTravelled();
		return { car, name: car.name, distance: car.distanceTravelled, element: `<li>${car.name}: ${car.distanceTravelled.toFixed(3)}</li>` };
	});
	list.sort((a, b) => b.distance - a.distance);
	while(leaderBoard.firstChild) {
		leaderBoard.removeChild(leaderBoard.firstChild);
	}
	const newList = list.map((li, index) => {
		return `<li><span>${index + 1}</span><span>${li.name}</span></li>`;
	})
	// leaderBoard.insertAdjacentHTML('afterbegin', list.map((li) => li.element).join(''));
	leaderBoard.insertAdjacentHTML('afterbegin', newList.join(''));
	gameEngine.camera.lockedTarget = list[0].car.chassis;
*/

}
gameEngine.startRenderLoop(renderLoopCallback);
if (runCars) {
	const lights = countdown();
	lights.start()
			.then(selectedTrack.gate.startRace)
			.then(lights.off);
}

/*

initFunction().then(() => { gameEngine.ready() });
*/
window.addEventListener("resize", gameEngine.resize());