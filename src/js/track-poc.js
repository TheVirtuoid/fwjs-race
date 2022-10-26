import { TrackPOC } from './Builder.js'

import BabylonAdapter from './BabylonAdapter.js'

import DebugDisplay from './DebugDisplay.js'
import DeclinationDisplay from './DeclinationDisplay.js'
import ErrorDisplay from './ErrorDisplay.js'
import TrackDisplay from './TrackDisplay.js'

import Ball from './Ball.js'
import { defineTracks } from './defineTracks.js'
import {testTrack} from "./tracks/testtrack";
import Car from "./models/Car";
import {Color3} from "@babylonjs/core";
import CarController from "./controllers/CarController";

//======================================================================
// WINDOW INITIALIZATION

let gameEngine;
let errorDisplay, debugDisplay, declinationDisplay;
let trackDisplay, ball;

function registerCallback(track) {
	debugDisplay.register(track);
	declinationDisplay.register(track);
}

const car = new Car({ scale: .2, name: 'Greeny', color: new Color3.Green(), wheelType: 'cylinder' });
let carController =

window.initFunction = async function() {

	// Hook DOM elements
	errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		'go',	// Disable ids
		[		// Disable functions
			(v) => debugDisplay.disable(v),
			(v) => declinationDisplay.disable(v)
		]);
	try {
		declinationDisplay = new DeclinationDisplay(
			"ThisIsMe", ".declination", "altDeclination",
			() => trackDisplay.createMesh());
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
				car.junk();
				}, registerCallback);
		ball = new Ball(gameEngine, trackDisplay, "go");
		carController = new CarController({ gameEngine, tracks: trackDisplay, car });
		document.getElementById('go-car').addEventListener('click', carController.placeInGate.bind(carController));


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
		defineTracks(trackDisplay);
		testTrack(trackDisplay);
		trackDisplay.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
initFunction().then(() => { gameEngine.ready() });
window.addEventListener("resize", gameEngine.resize());
