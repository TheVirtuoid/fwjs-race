import { TrackPOC } from './Builder.js'

import BabylonAdapter from './BabylonAdapter.js'

import DebugDisplay from './DebugDisplay.js'
import DeclinationDisplay from './DeclinationDisplay.js'
import ErrorDisplay from './ErrorDisplay.js'

//======================================================================
// BALL SUPPORT

const ball = {

	_diameter: .25,
	_height: 1,
	_inset: .8,
	_weight: 2,

	destroy: function() {
		this._mesh = gameEngine.destroyMesh(this._mesh);
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
		ball._mesh = gameEngine.createSphere("ball", {diameter: ball._diameter}, {mass: ball._weight});
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
		for (let mesh of this._meshes) gameEngine.destroyMesh(mesh);
		this._meshes.length = 0;

		try {
			const key = this._memberSelector.value;
			const track = this._tracks[key];
			const settings = this._options[key] ? this._options[key] : {};

			debugDisplay.register(track);
			declinationDisplay.register(track);

			const ribbons = TrackPOC(
				track,
				(u) => { return gameEngine.createVector(u) },
				settings);
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
				tracks._meshes.push(gameEngine.createRibbon(`Segment${i}`, ribbons[i], track.closed, { mass: 0 }));
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

let gameEngine;
let errorDisplay, debugDisplay, declinationDisplay;

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
		declinationDisplay = new DeclinationDisplay(
			"ThisIsMe", ".declination", "altDeclination",
			() => tracks.createMesh());
		debugDisplay = new DebugDisplay(
			['debugGeneral', 'debugSegments'],
			() => tracks.createMesh());

		// Create the game engine
		gameEngine = new BabylonAdapter();
		gameEngine.setCanvas("renderCanvas");

		tracks.setSelectors("trackFamilies", "trackMembers");
		ball.setButton("go");
	} catch (e) {
		errorDisplay.show(e);
		throw e;
	}

	const asyncEngineCreation = async function() {
		try {
			return gameEngine.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return gameEngine.createDefaultEngine();
		}
	}

	window.engine = await asyncEngineCreation();
	if (!window.engine) throw new Error('engine should not be null.');

	await gameEngine.initializePhysics();

	gameEngine.startRenderLoop();
	window.scene = gameEngine.createScene();

	// Get tracks
	try {
		defineTracks(tracks);
		tracks.start();
	} catch (e) {
		errorDisplay.showError(e);
	}
};
initFunction().then(() => { gameEngine.ready() });
window.addEventListener("resize", gameEngine.resize());
