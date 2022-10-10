import styles from "./../css/track-poc.pcss";

import Track from "./classes/Track";
import {
	AmmoJSPlugin,
	ArcRotateCamera, Color3,
	Engine,
	HemisphericLight, Mesh,
	MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3
} from "@babylonjs/core";
import LayoutSettings from "./classes/LayoutSettings";

import ammo from "ammo.js";
import track0 from './../layouts/track-0';
import track0a from './../layouts/track-0a';
import track1 from './../layouts/track-1';
import track1a from "../layouts/track-1a";
import track1b from "../layouts/track-1b";
import track2 from "../layouts/track-2";
import track2a from "../layouts/track-2a";
import track3 from "../layouts/track-3";
import track3a from "../layouts/track-3a";
import track4 from "../layouts/track-4";
import track5 from "../layouts/track-5";
import Car from "./classes/Car";


const defaultSettings = new LayoutSettings().toObject();

//======================================================================
// TRACK SELECTION
const trackSelector = document.getElementById("tracks");
trackSelector.addEventListener("change", () => {
	createMesh();
});

//======================================================================
// TRACK DEFINITIONS

// Nomenclature
//
// All track variables start with 'tm' denoting 'track #m'.
//
// A one or two letter abbreviate follows describing the type of
// The table below defines these. These are defined in relationship to
// one or a series of end points.
//
// A reference to a single end point uses the letter 'n'.
//
// A reference to a range of end points uses the form 'n_o' which
// refers to the end points n, n+1, ... o.
//
//	c	tmcn	a Bezier curve end point's center vector
//	ep	tmepn	a Bezier curve end point
//	s	tmsn_o	a segment (Bezier cubic curve)
//	t	tmtn_o	a tangent

const tracks = {};
const options = {};

tracks.track0 = {
	segments: track0.segments,
	closed: true,
}
options.track0 = track0.settings;

tracks.track0a = {
	segments: track0a.segments,
	closed: true,
}
options.track0a = track0a.settings;

tracks.track1 = {
	segments: track1.segments
};

tracks.track1a = {
	segments: track1a.segments
};

tracks.track1b = {
	segments: track1b.segments
};

tracks.track2 = {
	segments: track2.segments
};

tracks.track2a = {
	segments: track2a.segments
}

tracks.track3 = {
	segments: track3.segments
};

tracks.track3a = {
	segments: track3a.segments
};

tracks.track4 = {
	segments: track4.segments
};

tracks.track5 = {
	segments: track5.segments
};
//======================================================================
// BABYLON IMPLEMENTATION

const trackMeshes = [];

const createDefaultEngine = function(canvas) {
	return new Engine(canvas, true, {
		preserveDrawingBuffer: true,
		stencil: true,
		disableWebGL2Support: false
	});
};

const createScene = function (engine) {
	const scene = new Scene(engine);

	const camera = new ArcRotateCamera(
			"Camera",
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			Vector3.Zero());
	camera.attachControl(canvas, true);
	new HemisphericLight("hemi", new Vector3(0, 50, 0), scene);

	scene.enablePhysics(new Vector3(0,-8.91,0), new AmmoJSPlugin(true, Ammo));

	return scene;
}

const createMesh = function() {

	for (let mesh of trackMeshes) {
		scene.removeMesh(mesh);
		mesh.dispose();
	}
	trackMeshes.length = 0;

	const track = tracks[trackSelector.value];
	let settings = options[trackSelector.value];
	if (settings === null || settings === undefined) settings = {};

	const ribbons = Track.build(track, (u) => { return new Vector3(u.x, u.y, u.z); }, settings);
	for (let i = 0; i < ribbons.length; i++) {
		const trackMesh = MeshBuilder.CreateRibbon(
				`Segment${i}`,
				{
					pathArray: ribbons[i],
					sideOrientation: Mesh.DOUBLESIDE,
					closePath: track.closed,
				},
				scene);
		trackMesh.physicsImpostor = new PhysicsImpostor(trackMesh, PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1 }, scene);
		trackMeshes.push(trackMesh);
	}
}

const canvas = document.getElementById("renderCanvas");
const engine = createDefaultEngine(canvas);
const Ammo = await ammo.bind(window)();
const scene = createScene(engine);
createMesh();

engine.runRenderLoop(() => {
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});

// ball drop test
const ballDiameter = .25;
const ballWeight = 2;
let ball;
let car;
const dropTheBall = () => {

	if (ball) scene.removeMesh(ball);
	ball = MeshBuilder.CreateSphere("ball", { diameter: ballDiameter }, scene);
	ball.physicsImpostor = new PhysicsImpostor(ball, PhysicsImpostor.SphereImpostor, {mass: ballWeight}, scene);

	const track = tracks[trackSelector.value];
	const segment = track.segments[0];
	const p0 = segment.points[0].center || segment.points[0].startsAt;
	const p1 = segment.points[1].center || segment.points[1].endsAt;

	const t = .8;
	const olt = 1 - t;
	const altitude = 1;
	ball.position.x = p0.x * t + p1.x * olt;
	ball.position.y = p0.y * t + p0.y * olt + altitude;	// Force the ball above the track
	ball.position.z = p0.z * t + p1.z * olt;
};

const dropTheCar = () => {

	if (car) {
		car.junk();
	}

	const track = tracks[trackSelector.value];
	const segment = track.segments[0];
	const p0 = segment.points[0].center || segment.points[0].startsAt;
	const p1 = segment.points[1].center || segment.points[1].endsAt;

	const t = .8;
	const olt = 1 - t;
	const altitude = 1;
	const x = p0.x * t + p1.x * olt ;
	const y = p0.y * t + p0.y * olt + altitude;	// Force the ball above the track
	const z = p0.z * t + p1.z * olt;

	car = new Car({ scale: .25 });
	car.build({ name: 'test', scene, position: new Vector3(x, y, z), color: new Color3.Green() });

};

document.getElementById('go').addEventListener('click', dropTheBall);
document.getElementById('drop-car').addEventListener('click', dropTheCar);

