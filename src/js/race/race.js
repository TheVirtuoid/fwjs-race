import styles from "./../../css/race.pcss";

import BabylonAdapter from './utilities/BabylonAdapter.js'

import DebugDisplay from './utilities/DebugDisplay.js'
import ErrorDisplay from './utilities/ErrorDisplay.js'
import RaceTrackDisplay from './utilities/RaceTrackDisplay.js'

import {testTrack} from "./tracks/testtrack";
import Car2 from "./../models/Car2";
import CarOnTrack from "../models/CarOnTrack";
import {Color3, SceneLoader} from "@babylonjs/core";
import countdown from "./environment/countdown";
import Car3 from "../models/Car3";

//======================================================================
// WINDOW INITIALIZATION

let debugDisplay;

function registerCallback(track) {
	// debugDisplay.register(track);
}

const scale = .25;
const wheelType = 'ellipse';
const cars = new Map();
const runCars = true;

// Error Display
const errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		[],	// Disable ids
		[]);

const gameEngine = new BabylonAdapter();
gameEngine.setCanvas("renderCanvas");

const trackDisplay = new RaceTrackDisplay(
		gameEngine,
		errorDisplay,
			() => {
				cars.forEach((car) => car.junk());
				}, registerCallback);

const engine = gameEngine.createDefaultEngine();
await BabylonAdapter.initializePhysics();
// TODO Abstract out the scene, camera
const scene = gameEngine.createScene();
const camera = scene.cameras[0];

const slots = JSON.parse(sessionStorage.getItem('FWJS-Race'));
for(let i = 0, l = slots.length; i < l; i++) {
	const modelName = slots[i].car.model;
	const modelPath = modelName ? `/models/${modelName}/${modelName}.js` : `/models/cars/CarBase.js`
	const { default: car } = await import(/* @vite-ignore */ modelPath);
	slots[i].CarFactory = car;
	slots[i].model = await car.Load(scene);
}

let startingCarId = '';
slots.forEach((slot) => {
	const { name, id, color } = slot.car;
	const CarFactory = slot.CarFactory;
	const model = slot.model;
	cars.set(id, new CarFactory({ slot: slot.slot, scale, name, id, color, wheelType, model }));
	if (slot.slot === 1) {
		startingCarId = id;
	}
});

gameEngine.ready();

testTrack(trackDisplay, cars, scene);
trackDisplay.start();
const selectedTrack = trackDisplay.getSelectedTrack();
selectedTrack.gate.dropCars();
if (runCars) {
	camera.lockedTarget = cars.get(startingCarId).chassis;
}


const renderLoopCallback = () => {};
gameEngine.startRenderLoop(renderLoopCallback);
if (runCars) {
	const lights = countdown();
	lights.start()
			.then(selectedTrack.gate.startRace)
			.then(lights.off);
}

window.addEventListener("resize", gameEngine.resize());
