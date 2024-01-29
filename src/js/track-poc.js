import BabylonAdapter from './BabylonAdapter.js'

import DebugDisplay from './DebugDisplay.js'
import ErrorDisplay from './ErrorDisplay.js'
import TrackDisplay from './TrackDisplay.js'

import Ball from './Ball.js'
import { defineTracks } from './defineTracks.js'

//======================================================================
// WINDOW INITIALIZATION

let gameEngine;
let errorDisplay, debugDisplay;
let trackDisplay, ball;

function registerCallback(track) {
	debugDisplay.register(track);
}

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
			"trackFamilies", "trackMembers", "trackBuilds", gameEngine, errorDisplay,
			() => { ball.destroy() }, registerCallback);
		ball = new Ball(gameEngine, trackDisplay, "go");

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

	gameEngine.startRenderLoop();
	window.scene = gameEngine.createScene();

	// Get tracks
	try {
		defineTracks(trackDisplay);
		trackDisplay.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
initFunction().then(() => { gameEngine.ready() });
window.addEventListener("resize", gameEngine.resize());
