import initStandard from './standard.js'
import initTangentWeight from './tangentWeight.js'

function initPoint() {
}

function initSpiral() {
}

function initStraight() {
}

function initDemos() {
	initStandard();
	initTangentWeight();
	initPoint();
	initSpiral();
	initStraight();
};

window.initFunction = async function() {

	initDemos();

/*	// Hook DOM elements
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

	await gameEngine.initializePhysics();

	gameEngine.startRenderLoop();
	window.scene = gameEngine.createScene();

	// Get tracks
	try {
		defineTracks(trackDisplay);
		trackDisplay.start();
	} catch (e) {
		errorDisplay.showError(e);
	}*/
};

initFunction().then(() => { /*gameEngine.ready()*/ });