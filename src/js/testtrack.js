import {
	AmmoJSPlugin, ArcRotateCamera, Color3,
	Engine,
	FreeCamera,
	HemisphericLight,
	MeshBuilder,
	PhysicsImpostor,
	Scene, StandardMaterial,
	Vector3
} from "@babylonjs/core";
import ammo from "ammo.js";
import "@babylonjs/loaders";
import BabylonAdapter from "./race/utilities/BabylonAdapter";
import ErrorDisplay from "./race/utilities/ErrorDisplay";
import {testTrackLive} from "./testtrack-live";
import countdown from "./race/environment/countdown";
import RaceTrackDisplay from "./race/utilities/RaceTrackDisplay";

const gameEngine = new BabylonAdapter();
gameEngine.setCanvas("renderCanvas");

const errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		[],	// Disable ids
		[]);

const trackDisplay = new RaceTrackDisplay(
		gameEngine,
		errorDisplay,
		() => {},
		() => {}
);

const engine = gameEngine.createDefaultEngine();
await BabylonAdapter.initializePhysics();
// TODO Abstract out the scene, camera
const scene = gameEngine.createScene();
const camera = scene.cameras[0];

gameEngine.ready();

testTrackLive(trackDisplay, [], scene);
trackDisplay.start();
const selectedTrack = trackDisplay.getSelectedTrack();
const { x, y, z } = selectedTrack.last;

gameEngine.startRenderLoop(() => {});

const zeroPoint = new MeshBuilder.CreateSphere('zero', { diameter: .5 }, scene);
const zeroPointMat = new StandardMaterial('zeroMat', scene);
zeroPointMat.alpha = 1;
zeroPointMat.diffuseColor = Color3.Red();
zeroPoint.material = zeroPointMat;
// zeroPoint.position = new Vector3(-20, -1, 0);
zeroPoint.position = new Vector3(x, y, z);
camera.setTarget(zeroPoint.position.clone());


window.addEventListener("resize", gameEngine.resize());





/*

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas);
const scene = new Scene(engine);
// const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
const camera = new ArcRotateCamera("camera1", 0, 0, 3,  new Vector3(0, 5, -10), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);
const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Enable physics
await ammo.bind(window)();
scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin());

engine.runRenderLoop(() => {
	scene.render();
});
*/
