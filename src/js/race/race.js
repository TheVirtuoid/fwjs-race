import BabylonAdapter from './utilities/BabylonAdapter.js'

import DebugDisplay from './utilities/DebugDisplay.js'
import ErrorDisplay from './utilities/ErrorDisplay.js'
import TrackDisplay from './utilities/TrackDisplay.js'

import {testTrack} from "./tracks/testtrack";
import Car2 from "./../models/Car2";
import CarOnTrack from "../models/CarOnTrack";

//======================================================================
// WINDOW INITIALIZATION

let errorDisplay, debugDisplay;

function registerCallback(track) {
	// debugDisplay.register(track);
}

const carScale = .25
const cars = new Map();

const slots = JSON.parse(sessionStorage.getItem('FWJS-Race'));
slots.forEach((slot) => {
	const { name, id, color } = slot.car;
	cars.set(id, new CarOnTrack({ name, id, color }));
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
// selectedTrack.gate.dropCars();
// gameEngine.camera.lockedTarget = cars[0].chassis;


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

/*

initFunction().then(() => { gameEngine.ready() });
*/
window.addEventListener("resize", gameEngine.resize());
