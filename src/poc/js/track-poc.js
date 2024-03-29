import BabylonAdapter from './BabylonAdapter.js'

import DebugDisplay from './DebugDisplay.js'
import ErrorDisplay from './ErrorDisplay.js'
import TrackDisplay from './TrackDisplay.js'

import Ball from './Ball.js'
import { defineTracks } from './defineTracks.js'
import {testTrack} from "../../js/tracks/testtrack";
import Car from "../../js/models/Car";
import {Color3} from "@babylonjs/core";
import Car2 from "../../js/models/Car2";

//======================================================================
// WINDOW INITIALIZATION

let gameEngine;
let errorDisplay, debugDisplay;
let trackDisplay, ball;

function registerCallback(track) {
	debugDisplay.register(track);
}

const carScale = .25

const cars = [
	new Car2({ scale: carScale, name: 'Green Ghost', color: Color3.Green(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Red Devil', color: Color3.Red(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Yellow Belly', color: Color3.Yellow(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Am I Blue', color: Color3.Blue(), wheelType: 'ellipse' }),
]

window.initFunction = async function() {

	// Hook DOM elements
	errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		'go',	// Disable ids
		[		// Disable functions
			(v) => debugDisplay.disable(v),
		]);
	try {
		debugDisplay = new DebugDisplay(
			['debugGeneral', 'debugSegments'],
			() => trackDisplay.createMesh());

		// Create the game engine
		gameEngine = new BabylonAdapter();
		gameEngine.setCanvas("renderCanvas");

		trackDisplay = new TrackDisplay(
			"trackFamilies", "trackMembers", gameEngine, errorDisplay,
			() => {
				ball.destroy();
				cars.forEach((car) => car.junk());
				}, registerCallback);
		ball = new Ball(gameEngine, trackDisplay, "go");
		document.getElementById('go-car').addEventListener('click', () => {
			const selectedTrack = trackDisplay.getSelectedTrack();
			selectedTrack.gate.dropCars();
			gameEngine.camera.lockedTarget = cars[0].chassis;
		});
		document.getElementById('start').addEventListener('click', () => {
			const selectedTrack = trackDisplay.getSelectedTrack();
			selectedTrack.gate.startRace();
		});


	} catch (e) {
		errorDisplay.showError(e);
	}

	const asyncEngineCreation = async function() {
		try {
			return gameEngine.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return gameEngine.createDefaultEngine();
		}
	}

	window.engine = await asyncEngineCreation();
	if (!window.engine) throw new Error('engine should not be null.');

	await BabylonAdapter.initializePhysics();

	gameEngine.startRenderLoop(renderLoopCallback);
	window.scene = gameEngine.createScene();

	// Get tracks
	try {
		defineTracks(trackDisplay);
		testTrack(trackDisplay, cars, window.scene);
		trackDisplay.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
const leaderBoard = document.getElementById('leader-board');
const renderLoopCallback = () => {
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

}

initFunction().then(() => { gameEngine.ready() });
window.addEventListener("resize", gameEngine.resize());
