import styles from "../css/fwjs-race.pcss";

import Car from "./Car";

import {
	AmmoJSPlugin, Color3,
	Engine, FreeCamera,
	HemisphericLight, Mesh,
	MeshBuilder, PhysicsImpostor,
	Scene, SceneLoader,
	Vector3
} from "@babylonjs/core";
import "@babylonjs/loaders"

import ammo from "ammo.js";
const Ammo = await ammo.bind(window)();

const canvas = document.getElementById('world');
const engine = new Engine(canvas, true);

const scene = new Scene(engine);

const camera = new FreeCamera("camera1", new Vector3(0, 5, -7), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

scene.enablePhysics(new Vector3(0,-10,0), new AmmoJSPlugin(true, Ammo));

const ground = MeshBuilder.CreateGround("ground1", { width: 6, height: 6 }, scene);
ground.rotation.z = Math.PI / 32;
ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, scene);

const car = new Car({id: 'test', color: Color3.Green() });
car.build({ scene, position: new Vector3(0, 2, 0) });

/*SceneLoader.ImportMesh("", "models/", "skull.babylon", scene, function (newMeshes) {
	// Scale loaded mesh
	newMeshes[0].scaling.scaleInPlace(0.01);
	newMeshes[0].position.set(0,0,0)

	// Add colliders
	const collidersVisible = false;
	const sphereCollider = MeshBuilder.CreateSphere("sphere1", {segments: 16, diameter: 0.5 }, scene);
	sphereCollider.position.y = 0.08;
	sphereCollider.isVisible = collidersVisible;

	const boxCollider = MeshBuilder.CreateBox("box1", { size: 0.3 }, scene);
	boxCollider.position.y = -0.13;
	boxCollider.position.z = -0.13;
	boxCollider.isVisible = collidersVisible;

	// Create a physics root and add all children
	const physicsRoot = new Mesh("", scene);
	physicsRoot.addChild(newMeshes[0]);
	physicsRoot.addChild(boxCollider);
	physicsRoot.addChild(sphereCollider);
	physicsRoot.position.y+=3;

	// Enable physics on colliders first then physics root of the mesh
	boxCollider.physicsImpostor = new PhysicsImpostor(boxCollider, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
	sphereCollider.physicsImpostor = new PhysicsImpostor(sphereCollider, PhysicsImpostor.SphereImpostor, { mass: 0 }, scene);
	physicsRoot.physicsImpostor = new PhysicsImpostor(physicsRoot, PhysicsImpostor.NoImpostor, { mass: 3 }, scene);

	// Orient the physics root
	physicsRoot.rotation.x = Math.PI/5;
	physicsRoot.rotation.z = Math.PI/6;

});*/

engine.runRenderLoop(() => {
	scene.render();
});

