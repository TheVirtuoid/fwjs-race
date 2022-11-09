import BabylonAdapter from '../js/BabylonAdapter.js'
import initPoint from './point.js'
import initSpiral from './spiral.js'
import initStandard from './standard.js'
import initStraight from './straight.js'
import initTangentWeight from './tangentWeight.js'

const demos = [];
let engineAdapter;

window.initFunction = async function() {

	// Create the game engine
	engineAdapter = new BabylonAdapter();

	// Initialize the demos
	demos.push(initStandard(engineAdapter));
	demos.push(initTangentWeight(engineAdapter));
	demos.push(initPoint(engineAdapter));
	//demos.push(initSpiral(engineAdapter));
	//demos.push(initStraight(engineAdapter));

	// Complete the creation of the engine
	const asyncEngineCreation = async function() {
		try {
			return engineAdapter.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return engineAdapter.createDefaultEngine();
		}
	}

	// TODO: Investigate if setting 'window.engine' and 'window.scene'
	// is necessary. It appears this is not necessary.

	window.engine = await asyncEngineCreation();
	if (!window.engine) throw new Error('engine should not be null.');
	await engineAdapter.initializePhysics();
	engineAdapter.startRenderLoop();

	// Complete the initialization of demo views
	window.scene = engineAdapter.createScene();
};

initFunction().then(() => {
	engineAdapter.ready();
	for (let demo of demos) demo.draw();
});
