import BabylonAdapter from '../js/BabylonAdapter.js'
import initPoint from './point.js'
import initSpiral from './spiral.js'
import initStandard from './standard.js'
import initStraight from './straight.js'
import initTangentWeight from './tangentWeight.js'

const demos = [];
let gameEngine;

window.initFunction = async function() {

	// Create the game engine
	gameEngine = new BabylonAdapter();

	// Initialize the demos
	demos.push(initStandard(gameEngine));
	demos.push(initTangentWeight(gameEngine));
	demos.push(initPoint(gameEngine));
	//demos.push(initSpiral(gameEngine));
	//demos.push(initStraight(gameEngine));

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

initFunction().then(() => {
	gameEngine.ready();
	for (let demo of demos) demo.draw();
});
