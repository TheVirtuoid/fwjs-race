import { TrackPOC } from './Builder.js'

import BabylonAdapter from './BabylonAdapter.js'

import DebugDisplay from './DebugDisplay.js'
import ErrorDisplay from './ErrorDisplay.js'
import TrackDisplay from './TrackDisplay.js'

import Ball from './Ball.js'
import { defineTracks } from './defineTracks.js'
import {testTrack} from "./tracks/testtrack";
import Car from "./models/Car";
import {Color3} from "@babylonjs/core";
import Car2 from "./models/Car2";

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
	new Car2({ scale: carScale, name: 'Green Ghost', color: new Color3.Green(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Red Devil', color: new Color3.Red(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Yellow Belly', color: new Color3.Yellow(), wheelType: 'ellipse' }),
	new Car2({ scale: carScale, name: 'Am I Blue', color: new Color3.Blue(), wheelType: 'ellipse' }),
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

	await gameEngine.initializePhysics();

	gameEngine.startRenderLoop();
	window.scene = gameEngine.createScene();

	// Get tracks
	try {
		// defineTracks(trackDisplay);
		testTrack(trackDisplay, cars, window.scene);
		trackDisplay.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
initFunction().then(() => { gameEngine.ready() });
window.addEventListener("resize", gameEngine.resize());
