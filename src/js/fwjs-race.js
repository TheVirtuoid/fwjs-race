import styles from "../css/fwjs-race.pcss";
import {
	AmmoJSPlugin,
	Engine, FreeCamera,
	HemisphericLight, Mesh,
	MeshBuilder, PhysicsImpostor,
	Scene, SceneLoader,
	Vector3
} from "@babylonjs/core";
import "@babylonjs/loaders"

import ammo from "./ammo.js";
const Ammo = await ammo();

const makePhysicsObject = (newMeshes, scene, scaling)=>{
	// Create physics root and position it to be the center of mass for the imported mesh
	const physicsRoot = new Mesh("physicsRoot", scene);
	physicsRoot.position.y -= 0.9;

	// For all children labeled box (representing colliders), make them invisible and add them as a child of the root object
	newMeshes.forEach((m, i)=>{
		if(m.name.indexOf("box") != -1){
			m.isVisible = false
			physicsRoot.addChild(m)
		}
	})

	// Add all root nodes within the loaded gltf to the physics root
	newMeshes.forEach((m, i)=>{
		if(m.parent == null){
			physicsRoot.addChild(m)
		}
	})

	// Make every collider into a physics impostor
	physicsRoot.getChildMeshes().forEach((m)=>{
		if(m.name.indexOf("box") != -1){
			m.scaling.x = Math.abs(m.scaling.x)
			m.scaling.y = Math.abs(m.scaling.y)
			m.scaling.z = Math.abs(m.scaling.z)
			m.physicsImpostor = new PhysicsImpostor(m, PhysicsImpostor.BoxImpostor, { mass: 0.1 }, scene);
		}
	})

	// Scale the root object and turn it into a physics impsotor
	physicsRoot.scaling.scaleInPlace(scaling)
	physicsRoot.physicsImpostor = new PhysicsImpostor(physicsRoot, PhysicsImpostor.NoImpostor, { mass: 3 }, scene);

	return physicsRoot
}


const canvas = document.getElementById('world');
const engine = new Engine(canvas, true);

const scene = new Scene(engine);

const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

let light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Enable physics
scene.enablePhysics(new Vector3(0,-9.81,0), new AmmoJSPlugin(true, Ammo));

// Create ground collider
const ground = MeshBuilder.CreateGround("ground1", {height: 8, width: 8}, scene);
ground.rotation.z = Math.PI / 16;
ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0, restitution: 1 }, scene);

// Import gltf
const newMeshes = (await SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/TrevorDev/gltfModels/master/weirdShape.glb", "", scene)).meshes;
//const newMeshes = (await SceneLoader.ImportMeshAsync("", "/models/weirdShape.glb", "", scene)).meshes;

// Convert to physics object and position
const physicsRoot = makePhysicsObject(newMeshes, scene, 0.2)
physicsRoot.position.y += 3


engine.runRenderLoop(() => {
	scene.render();
});

