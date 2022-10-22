import {
	AmmoJSPlugin, ArcRotateCamera,
	Engine,
	HemisphericLight,
	Mesh, MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3 as BabylonVector3,
} from "@babylonjs/core";

import ammo from "ammo.js";

import { TrackPOC } from './Builder.js'
import Vector3 from './Vector3.js'

import ErrorDisplay from './ErrorDisplay.js'

//======================================================================
// DEBUG MANAGER

const debugDisplay = {

	disable: function() {
		for (let elem of this._elements) {
			elem.element.disabled = true;
			elem.element.checked = false;
		}
	},

	register: function(track) {
		this._track = track;
		for (let elem of this._elements) {
			elem.element.disabled = false;
			elem.element.checked = track[elem.member];
		}
	},

	init: function(debugIds) {
		for (let id of debugIds) {
			const elem = document.getElementById(id);
			if (!elem) throw new Error('Cannot find debug id ' + id);
			if (!elem.hasAttribute('member')) throw new Error(`Element ${id} must have a 'member' attribute`);

			this._elements.push({ element: elem, member: elem.getAttribute('member')});
			elem.disabled = true;
			elem.checked = false;
			elem.addEventListener("click", (e) => { this._onClick(e) });
		}
	},

	_onClick: function(event) {
		if (this._track) {
			const checkbox = event.target;
			const member = checkbox.getAttribute('member')
			this._track[member] = checkbox.checked;
			if (checkbox.checked) tracks.createMesh();
		}
	},

	_elements: [],
}

//======================================================================
// DECLINATION MANAGER

const declinationDisplay = {

	disable: function(state = true) {
		if (this._valueInput) {
			this._valueInput.disable = state;
			this._resetButton.disable =  state;
			this._clearButton.disable = state;
			this._algoSelector.disable = state;
		}
	},

	register: function(track) {
		if (!track || track.altDeclination === null || track.altDeclination === undefined) {
			this._track = false;
		} else {
			this._track = track;
			this._valueInput.value = track.altDeclination;
		}

		this._styleRule.style = "display:" + (this._track ? "block" : "none");
	},

	init: function(styleSheetTitle, styleSelector, input) {

		// Find the style sheet
		for (let sheet of document.styleSheets) {
			if (styleSheetTitle === sheet.title) {
				this._styleSheet = sheet;
				break;
			}
		}
		if (!this._styleSheet) {
			throw new Error('declinateDisplay.init: Cannot find stylesheet ' + styleSheetTitle);
		}

		// Find the rule
		if (this._styleSheet) {
			for (let rule of this._styleSheet.cssRules) {
				if (rule instanceof CSSStyleRule && rule.selectorText === styleSelector) {
					this._styleRule = rule;
					break;
				}
			}
			if (!this._styleRule) throw new Error('declinateDisplay.init: Cannot find selector ' + styleSelector);
		}

		// Find the user input elements
		this._valueInput = document.getElementById(input);
		this._valueInput.addEventListener("change", (e) => this._onChangeValue(e));
		this._resetButton = document.getElementById(input + "Reset");
		this._resetButton.addEventListener("click", (e) => this._onReset(e));
		this._clearButton = document.getElementById(input + "Clear");
		this._clearButton.addEventListener("click", (e) => this._onClear(e));
		this._algoSelector = document.getElementById(input + "Algo");
		this._algoSelector.addEventListener("change", (e) => this._onChangeAlgo(e));

		// Trigger the initial display
		this.register();
	},

	_onChangeAlgo: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},

	_onChangeValue: function(e) {
		console.log(e);
		const value = Number(this._valueInput.value);
		if (value != this._track.altDeclination) {
			this._track.altDeclination = value;
			tracks.createMesh();
		}
	},

	_onClear: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},

	_onReset: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},
}

//======================================================================
// BABYLON SUPPORT

const babylon = {
	createDefaultEngine: function() {
		if (!this._canvas) throw "Must invoke setCanvas first";
		this._engine = new Engine(this._canvas, true, {
			preserveDrawingBuffer: true,
			stencil: true,
			disableWebGL2Support: false
		});
		return this._engine;
	},
	createRibbon: function(name, ribbon, closed, meshOptions) {
		if (!this._scene) throw "Must invoke createScene first";
		const mesh = MeshBuilder.CreateRibbon(
			name,
			{
				pathArray: ribbon,
				sideOrientation: Mesh.DOUBLESIDE,
				closePath: closed,
			},
			this._scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, this._scene);
		return mesh;
	},
	createScene: function () {
		if (!this._canvas) throw "Must invoke setCanvas first";
		if (!this._engine) throw "Must invoke createDefaultEngine first";
		this._scene = new Scene(this._engine);
		const camera = new ArcRotateCamera(
			"Camera",
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			BabylonVector3.Zero());
		camera.attachControl(this._canvas, true);
		const light = new HemisphericLight("hemi", new BabylonVector3(0, 50, 0));
		this._scene.enablePhysics(new BabylonVector3(0, -8.91, 0), new AmmoJSPlugin());
		return this._scene;
	},
	createSphere: function(name, sphereOptions, impostorOptions) {
		if (!this._scene) throw "Must invoke createScene first";
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, this._scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, this._scene);
		return mesh;
	},
	destroyMesh: function(mesh) {
		if (!this._scene) throw "Must invoke createScene first";
		if (mesh) {
			this._scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	},
	ready: function() {
		if (!this._scene) throw "Must invoke createScene first";
		this._ready = true;
	},
	resize: function() { if (this._engine) this._engine.resize(); },
	setCanvas: function(id) { this._canvas = document.getElementById(id); },
	startRenderLoop: function () {
		if (!this._engine) throw "Must invoke createDefaultEngine first";
		this._engine.runRenderLoop(function () {
			if (babylon._ready && babylon._scene.activeCamera) {
				babylon._scene.render();
			}
		});
	},
}

//======================================================================
// BALL SUPPORT

const ball = {

	_diameter: .25,
	_height: 1,
	_inset: .8,
	_weight: 2,

	destroy: function() {
		this._mesh = babylon.destroyMesh(this._mesh);
	},
	setButton(id) {
		document.getElementById(id).addEventListener('click', (e) => { this._drop(e) });
	},

	_drop: function(e) {
		console.log(e);
		ball.destroy();
		const {p0, p1} = tracks.getTrackStart();
		const t = ball._inset;
		const olt = 1 - t;
		ball._mesh = babylon.createSphere("ball", {diameter: ball._diameter}, {mass: ball._weight});
		ball._mesh.position.x = p0.x * t + p1.x * olt;
		ball._mesh.position.y = p0.y * t + p0.y * olt + ball._height;
		ball._mesh.position.z = p0.z * t + p1.z * olt;
	},
}

//======================================================================
// TRACK MANAGEMENT

const tracks = {
	getTrackStart: function() { return this._start; },
	register: function(track) {

		// Invoke function if not an object
		if (typeof(track) === 'function') track = track();

		// Perform late initialization
		if (track.init) track.init();

		// Get the family
		if (!track.family && !track.sibling) throw "A track must define either 'family' or 'sibling'";
		if ((track.family || track.sibling) && (track.name || track.desc)) throw "A track defining 'family' or 'sibling' cannot define 'name' or 'desc'";
		if (track.sibling && !track.sibling.family) throw `A 'sibling' track, here '${track.sibling}', must define 'family'`;
		const family = track.family ? track.family : track.sibling.family;
		const familyKey = this._removeSpaces(family);

		// Get the member
		if (track.sibling && !track.member) throw "A track defining 'sibling' must also define 'member'";
		if (track.sibling && track.member && track.member === this._originalMember) {
			throw `A track defining 'sibling' cannot have 'member' set to '${this._originalMember}'`;
		}
		const member = track.member ? track.member : this._originalMember;
		const memberKey = familyKey + this._removeSpaces(member);
		const key = familyKey + memberKey;

		// Add family if necessary
		if (!this._families[familyKey]) {
			// This possibly leads to multiple member lists to avoid
			// altering the 'display' style in onFamilyChanged
			this._families[familyKey] = [];

			// Add the family to the family list
			const fsOption = document.createElement("option");
			fsOption.setAttribute('value', familyKey);
			fsOption.innerHTML = family;
			this._familySelector.appendChild(fsOption);
		}

		// Add to member selector
		const msOption = document.createElement("option");
		msOption.setAttribute('value', key);
		msOption.setAttribute('family', familyKey);
		msOption.innerHTML = member;
		this._memberSelector.appendChild(msOption);

		// Add the track to the tracks and options arrays
		this._tracks[key] = track.track;
		if (track.options) this._options[key] = track.options;

		return track;
	},
	setSelectors: function(familyId, membersId) {
		this._familySelector = document.getElementById(familyId);
		this._memberSelector = document.getElementById(membersId);
		this._familySelector.addEventListener("change", () => this._onFamilyChanged());
		this._memberSelector.addEventListener("change", () => this._onMemberChanged());
	},
	start: function() {
		if (!this._familySelector || !this._memberSelector) throw "Must invoke setSelectors first";
		this._onFamilyChanged();
	},

	createMesh: function() {
		ball.destroy();
		for (let mesh of this._meshes) babylon.destroyMesh(mesh);
		this._meshes.length = 0;

		try {
			const key = this._memberSelector.value;
			const track = this._tracks[key];
			const settings = this._options[key] ? this._options[key] : {};

			debugDisplay.register(track);
			declinationDisplay.register(track);

			const ribbons = TrackPOC(track, (u) => { return new BabylonVector3(u.x, u.y, u.z); }, settings);
			const ribbon = ribbons[0];
			const leftRoad = ribbon[1];
			const rightRoad = ribbon[2];
			const p0left = leftRoad[0];
			const p0right = rightRoad[0];
			const p1left = leftRoad[1];
			const p1right = rightRoad[1];
			this._start = {
				p0: {
					x: (p0left.x + p0right.x) / 2,
					y: (p0left.y + p0right.y) / 2,
					z: (p0left.z + p0right.z) / 2,
				},
				p1: {
					x: (p1left.x + p1right.x) / 2,
					y: (p1left.y + p1right.y) / 2,
					z: (p1left.z + p1right.z) / 2,
				},
			}
			for (let i = 0; i < ribbons.length; i++) {
				tracks._meshes.push(babylon.createRibbon(`Segment${i}`, ribbons[i], track.closed, { mass: 0 }));
			}
			errorDisplay.clear();
		} catch (e) {
			errorDisplay.showError(e);
		}
	},

	_onFamilyChanged: function() {
		const key = this._familySelector.value;
		let firstMatch = -1;
		for (let i = 0; i < this._memberSelector.options.length; i++) {
			const option = this._memberSelector.options[i];
			const match = option.getAttribute("family") === key;
			option.style.display = match ? "block" : "none";
			if (match && firstMatch === -1) firstMatch = i;
		}
		if (firstMatch !== -1) this._memberSelector.selectedIndex = firstMatch;
		this.createMesh();
	},
	_onMemberChanged: function() { this.createMesh(); },

	_families: {},
	_meshes: [],
	_options: {},
	_originalMember: 'Original',
	_removeSpaces: function(value) { return value.replace(/\s/g, ''); },
	_tracks: {},
};

import { defineTracks } from './defineTracks.js'

//======================================================================
// WINDOW INITIALIZATION

let errorDisplay;

window.initFunction = async function() {

	// Hook DOM elements
	errorDisplay = new ErrorDisplay(
		'track-error', 'track-error-text',
		'go',	// Disable ids
		[		// Disable functions
			(v) => debugDisplay.disable(v),
			(v) => declinationDisplay.disable(v)
		]);
	try {
		declinationDisplay.init("ThisIsMe", ".declination", "altDeclination");
		debugDisplay.init(['debugGeneral', 'debugSegments']);
		babylon.setCanvas("renderCanvas");
		tracks.setSelectors("trackFamilies", "trackMembers");
		ball.setButton("go");
	} catch (e) {
		errorDisplay.show(e);
		throw e;
	}

	const asyncEngineCreation = async function() {
		try {
			return babylon.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return babylon.createDefaultEngine();
		}
	}

	window.engine = await asyncEngineCreation();
	if (!babylon._engine) throw 'engine should not be null.';

	await ammo.bind(window)();

	babylon.startRenderLoop();
	window.scene = babylon.createScene();

	// Get tracks
	try {
		defineTracks(tracks);
		tracks.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
initFunction().then(() => { babylon.ready() });
window.addEventListener("resize", babylon.resize());
