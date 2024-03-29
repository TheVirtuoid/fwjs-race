import {
	AmmoJSPlugin, ArcRotateCamera,
	Engine,
	HemisphericLight,
	MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3
} from "@babylonjs/core";
import ammo from "ammo.js";
import "@babylonjs/loaders";

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
const ground = MeshBuilder.CreateGround("ground1", { width: 12, height: 12 }, scene);
// ground.rotate(new Vector3(0, 0, 1), 12 * Math.PI / 180);
ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 100, restitution: 0 }, scene);


// create walls so the car doesn't roll off screen
const wallHeight = 1.75;
const wall1 = MeshBuilder.CreateBox("wall1", { width: 12, height: wallHeight, depth: .2 }, scene);
wall1.position = new Vector3(0, 0 ,6);
wall1.physicsImpostor = new PhysicsImpostor(wall1, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
const wall2 = MeshBuilder.CreateBox("wall2", { width: 12, height: wallHeight, depth: .2 }, scene);
wall2.position = new Vector3(0, 0 ,-6);
wall2.physicsImpostor = new PhysicsImpostor(wall2, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
const wall3 = MeshBuilder.CreateBox("wall3", { width: .2, height: wallHeight, depth: 12 }, scene);
wall3.position = new Vector3(6, 0 ,0);
wall3.physicsImpostor = new PhysicsImpostor(wall3, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
const wall4 = MeshBuilder.CreateBox("wall4", { width: .2, height: wallHeight, depth: 12 }, scene);
wall4.position = new Vector3(-6, 0 ,0);
wall4.physicsImpostor = new PhysicsImpostor(wall4, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

const meshList = document.querySelector('#meshes ul');
meshList.addEventListener('click', processClick);
const selectCar = document.getElementById('selectCar');
selectCar.addEventListener('change', processCarSelection);

const name = 'TestCar';

loadCar(selectCar.value, name);
let model;
let car;
const baseMeshListMap = new Map([
	[-3, { text: 'Body', prop: 'body' }],
	[-2, { text: 'Transmission', prop: 'transmission' }],
	[-1, { text: 'Wheels', prop: 'wheels', meshArray: true }]
]);

async function loadCar(modelName, name) {
	const id = 'TestCar';
	const color = "#FF0000";

	const modelPath = modelName ? `/models/${modelName}/${modelName}.js` : `/models/cars/CarBase.js`
	const { default: CarFactory } = await import(/* @vite-ignore */ modelPath);
	model = await CarFactory.Load(scene);

	const boundingVectors = model?.meshes[0].getHierarchyBoundingVectors();
	buildMeshList(model);

	car = new CarFactory({ position: new Vector3(0, 1, 0), scene, name, id, color, model, boundingVectors });
	car.build({ name });
}

engine.runRenderLoop(() => {
	scene.render();
});


function buildMeshList (model) {
	while (meshList.firstChild) {
		meshList.removeChild(meshList.firstChild);
	}
	baseMeshListMap.forEach((baseMeshList, index) => {
		const { text } = baseMeshList;
		meshList.insertAdjacentHTML('beforeend', `
		<li><span>${text}</span>
			<input type="checkbox" data-tag="visible" data-index="${index}" checked />
			<input type="checkbox" data-tag="box" data-index="${index}" />
		</li>`);
	});
	if (model?.meshes) {
		model.meshes.forEach((mesh, index) => {
			const li = `<li><span>Mesh ${index}:</span>
					<input type="checkbox" data-tag="visible" data-index="${index}" checked />
					<input type="checkbox" data-tag="box" data-index="${index}" />
			</li>`
			meshList.insertAdjacentHTML('beforeend', li);
		});
	}
}

function processClick(event) {
	const meshNumber = parseInt(event.target.getAttribute('data-index'));
	const tag = event.target.getAttribute('data-tag');
	let mesh;
	let meshArray = false;
	if (meshNumber < 0) {
		const baseMeshList = baseMeshListMap.get(meshNumber);
		const prop = baseMeshList.prop;
		meshArray = baseMeshList.meshArray;
		if (meshArray) {
			mesh = car[prop];
		} else {
			mesh = car[prop].mesh;
		}
	} else {
		mesh = model.meshes[meshNumber];
	}
	switch(tag) {
		case 'visible':
			if (meshArray) {
				mesh.forEach((subMesh) => subMesh.mesh.isVisible = !subMesh.mesh.isVisible);
			} else {
				mesh.isVisible = !mesh.isVisible;
			}
			break;
		case 'box':
			if (meshArray) {
				mesh.forEach((subMesh) => subMesh.mesh.showBoundingBox = !subMesh.mesh.showBoundingBox);
			} else {
				mesh.showBoundingBox = !mesh.showBoundingBox;
			}
			break;
	}
}

function processCarSelection(event) {
	const carSelected = event.target.value;
	car.junk();
	car = null;
	loadCar(carSelected);
}

