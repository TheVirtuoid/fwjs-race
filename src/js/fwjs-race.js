import styles from "../css/fwjs-race.pcss";
import {
	ArcRotateCamera,
	Color3,
	DirectionalLight,
	Engine,
	HemisphericLight,
	MeshBuilder,
	Scene,
	StandardMaterial,
	Vector3
} from "@babylonjs/core";
import CarBasic from "../models/cars/Basic/CarBasic";

const world = document.getElementById('world');
const engine = new Engine(world, true);
const scene = new Scene(engine);
const camera = new ArcRotateCamera("camera1", 0, 0, 20, new Vector3(0, 0, 0), scene);
camera.setPosition(new Vector3(11.5, 3.5, 0));
camera.attachControl(world, true);

const car = new CarBasic({ scene });

const light1 = new DirectionalLight("light1", new Vector3(1, 2, 0), scene);
const light2 = new HemisphericLight("light2", new Vector3(0, 1, 0), scene);
light2.intensity = 0.75;

const ground = MeshBuilder.CreateGround("ground", {
	width: 400,
	height: 400
}, scene);

const groundMaterial = new StandardMaterial("ground", scene);
groundMaterial.diffuseColor = new Color3(0.75, 1, 0.25);
ground.material = groundMaterial;
ground.position.y = -1.5;

engine.runRenderLoop( () => {
	scene.render();
});