import BabylonAdapter from '../js/BabylonAdapter.js'
import initPoint from './point.js'
import initStandard from './standard.js'
import initTangentWeight from './tangentWeight.js'

function initSpiral(engine) {
}

function initStraight(engine) {
}

let gameEngine;

window.initFunction = async function() {

	// Create the game engine
	gameEngine = new BabylonAdapter();

	// Initialize the demos
	initStandard(gameEngine);
	initTangentWeight(gameEngine);
	initPoint(gameEngine);
	initSpiral(gameEngine);
	initStraight(gameEngine);

	// Complete the creation of the engine
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

	// Complete the initialization of demo views
	window.scene = gameEngine.createViews();
};

initFunction().then(() => { gameEngine.ready() });
