import styles from "../css/fwjs-race.pcss";
import {
	ArcRotateCamera, CannonJSPlugin,
	Color3,
	DirectionalLight,
	Engine,
	HemisphericLight, HingeJoint,
	MeshBuilder, PhysicsImpostor,
	Scene,
	StandardMaterial,
	Vector3
} from "@babylonjs/core";

import Cannon from "cannon";

window.CANNON = Cannon;

const world = document.getElementById('world');
const engine = new Engine(world, true);

const scene = new Scene(engine);


const camera = new ArcRotateCamera("Camera",Math.PI / 8, Math.PI / 2.5, 50, Vector3.Zero(), scene);

camera.attachControl(world, true);

const light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

// grounds
const ground1 = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
ground1.position.y = -3.1;
ground1.position.x = 25;
ground1.position.z = 25;
ground1.rotation.z = 0.1;
ground1.rotation.x = -0.1;

const ground2 = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
ground2.position.y = -3.1;
ground2.position.x = -25;
ground2.position.z = 25;
ground2.rotation.z = -0.1;
ground2.rotation.x = -0.1;

const ground3 = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
ground3.position.y = -3.1;
ground3.position.x = 25;
ground3.position.z = -25;
ground3.rotation.z = 0.1;
ground3.rotation.x = 0.1;

const ground4 = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
ground4.position.y = -3.1;
ground4.position.x = -25;
ground4.position.z = -25;
ground4.rotation.z = -0.1;
ground4.rotation.x = 0.1;

function rand() {
	let sign = Math.random() < 0.5;
	return Math.random() * (sign ? 1 : -1);
}

function ballPosition(ball) {
	ball.position.y = -2;
	ball.position.x = rand() * 50;
	ball.position.z = rand() * 50;
}

const ball = MeshBuilder.CreateSphere("ball", {diameter: 2, segments: 4}, scene);
ballPosition(ball);
let balls = [ball];

for(let i = 0; i < 1; ++i) {
	let b = ball.clone("ball" + i);
	ballPosition(b)
	balls.push(b);
}



scene.enablePhysics(undefined, new CannonJSPlugin(true, 100));



[ground1, ground2, ground3, ground4].forEach(ground => {
	ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {mass: 0});
});

balls.forEach(ball => {
	ball.physicsImpostor = new PhysicsImpostor(ball, PhysicsImpostor.SphereImpostor, {mass: 1});
});

engine.runRenderLoop(() => {
	scene.render();
});