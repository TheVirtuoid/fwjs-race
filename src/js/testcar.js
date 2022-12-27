import {
	AmmoJSPlugin, ArcRotateCamera, Color3,
	Engine,
	FreeCamera,
	HemisphericLight,
	MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3
} from "@babylonjs/core";
import ammo from "ammo.js";
import "@babylonjs/loaders";
import CarBase from "/models/cars/CarBase.js";
import LowPoly2 from "../models/LowPoly2/LowPoly2";

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

// Create ground collider
const ground = MeshBuilder.CreateGround("ground1", { width: 8, height: 8 }, scene);
//ground.rotation = new Vector3(0, 0, Math.PI / 64 );
ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 100, restitution: 0 }, scene);

const meshList = document.querySelector('#meshes ul');
meshList.addEventListener('click', processClick);

const id = 'TestCar';
const wheelType = 'ellipse';
const scale = .3;
const modelName = 'LowPolyCar';
const color = "#FF0000";

const modelPath = modelName ? `/models/${modelName}/${modelName}.js` : `/models/cars/CarBase.js`
const { default: CarFactory } = await import(/* @vite-ignore */ modelPath);
const model = await CarFactory.Load(scene);
buildMeshList(model);

const car = new CarFactory({ position: new Vector3(0, 1, 0), scale, name, id, color, model, wheelType });
car.build();


engine.runRenderLoop(() => {
	scene.render();
});


function buildMeshList (model) {
	while (meshList.firstChild) {
		meshList.removeChild(meshList.firstChild);
	}
	model.meshes.forEach((mesh, index) => {
		const li = `<li><span>Mesh ${index}:</span><input type="checkbox" data-index="${index}" checked /></li>`
		meshList.insertAdjacentHTML('beforeend', li);
	});
}

function processClick(event) {
	const meshNumber = parseInt(event.target.getAttribute('data-index'));
	model.meshes[meshNumber].isVisible = !model.meshes[meshNumber].isVisible;
}

