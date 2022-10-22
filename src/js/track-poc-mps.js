import {
	AmmoJSPlugin,
	ArcRotateCamera,
	Engine,
	HemisphericLight,
	Mesh,
	MeshBuilder,
	PhysicsImpostor,
	Scene,
	Vector3
} from "@babylonjs/core";
import ammo from "ammo.js";
import {TrackPOC} from "./track-poc-util";


//======================================================================
// ERROR DISPLAY MANAGER

const errorDisplay = {
	clear: function() {
		this._trackError.style.display = "none";
		this._disable(false);
	},

	show: function(e) {
		console.log(e);
		this._trackError.style.display = "block";
		this._trackErrorText.innerText = e.toString();
		this._disable(true);
	},

	init: function(div, text, disableOnError = []) {
		this._trackError = document.getElementById(div);
		this._trackErrorText = document.getElementById(text);
		this._disableOnError = [];
		for (let id of disableOnError) {
			this._disableOnError.push(document.getElementById(id));
		}
	},

	_disable: function(disable) {
		for (let element of this._disableOnError) {
			element.disabled = disable;
		}
	},
}

//======================================================================
// ALT DECLINATION MANAGER

const altDeclinationDisplay = {

	register: function(track) {
		if (!track || track.altDeclination === null || track.altDeclination === undefined) {
			this._track = false;
		} else {
			this._track = track;
			this._input.value = track.altDeclination;
			console.log(this._input.value, track.altDeclination);
		}
		this._div.style.display = this._track ? "block" : "none";
	},

	init: function(div, input) {
		this._div = document.getElementById(div);
		this._input = document.getElementById(input);
		this._input.addEventListener("change", () => this._onChange());
		this.register();
	},

	_onChange: function() {
		const value = Number(this._input.value);
		if (value != this._track.altDeclination) {
			this._track.altDeclination = value;
			tracks._createMesh();
		}
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
				Vector3.Zero());
		camera.attachControl(this._canvas, true);
		const light = new HemisphericLight("hemi", new Vector3(0, 50, 0));
		this._scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin(true, Ammo));
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
		document.getElementById(id).addEventListener('click', this._drop);
	},

	_drop: function() {
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
		this._memberSelector.addEventListener("change", () => this._createMesh());
	},
	start: function() {
		if (!this._familySelector || !this._memberSelector) throw "Must invoke setSelectors first";
		this._onFamilyChanged();
	},

	_createMesh: function() {
		ball.destroy();
		for (let mesh of this._meshes) babylon.destroyMesh(mesh);
		this._meshes.length = 0;

		try {
			const key = this._memberSelector.value;
			const track = this._tracks[key];
			const settings = this._options[key] ? this._options[key] : {};

			altDeclinationDisplay.register(track);

			const ribbons = TrackPOC.build(track, (u) => { return new Vector3(u.x, u.y, u.z); }, settings);
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
			errorDisplay.show(e);
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
		this._createMesh();
	},

	_families: {},
	_meshes: [],
	_options: {},
	_originalMember: 'Original',
	_removeSpaces: function(value) { return value.replace(/\s/g, ''); },
	_tracks: {},
};

//======================================================================
// TRACK DEFINITION

const posX = new Vector3.Right;
const negX = new Vector3.Left;
const posY = new Vector3.Up;
const negY = new Vector3.Down;
const posZ = new Vector3.Forward;
const negZ = new Vector3.Backward;
const zero = { x:0, y:0, z:0 };

const defineTracks = function() {

	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;

	//----------------------------------------------------------------------
	// Closed ovals

	const track0 = tracks.register({
		family: 'Closed oval',
		points: [
			{ center: new Vector3(2, 0, 0), forward: posZ },	// Start position
			{ center: new Vector3(2, 0, 4), forward: posZ },
			{ center: new Vector3(0, 0, 6), forward: negX },
			{ center: new Vector3(-2, 0, 4), forward: negZ },
			{ center: new Vector3(-2, 0, -4), forward: negZ },
			{ center: new Vector3(0, 0, -6), forward: posX },
			{ center: new Vector3(2, 0, -4), forward: posZ },
		],
		track: { closed: true },
		options: {
			backwardWeight: 0.5,
			forwardWeight: 0.5,
			trackWidth: 0.5,
		},
		init: function() {
			this.track.segments = [ { points: this.points } ];
		}
	});
	tracks.register({
		sibling: track0,
		member: 'Variable wall height',
		options: track0.options,
		track: {
			closed: true,
			segments: [
				{
					points: [
						track0.points[0],
						{ center: track0.points[1].center, forward: track0.points[1].forward, wallHeight: .6 },
						{ center: track0.points[2].center, forward: track0.points[2].forward, wallHeight: .7 },
						{ center: track0.points[3].center, forward: track0.points[3].forward, wallHeight: .6 },
						track0.points[4],
						track0.points[5],
						track0.points[6],
					],
				},
			],
		},
	});

	//----------------------------------------------------------------------
	// Common launch and jump points

	const launch = {
		start: {
			center: { x:10 , y:5, z:0 }
		},
		end: {
			center: { x:9, y:4.9, z:0 },
		},

		init: function() {
			this.start.forward = {
				x: this.end.center.x - this.start.center.x,
				y: this.end.center.y - this.start.center.y,
				z: this.end.center.z - this.start.center.z,
			};
			this.end.forward = this.start.forward;
			this.straight = {
				type: 'straight',
				endsAt: this.end.center,
				startsAt: this.start.center,
				forwardWeight: 1.1
			};
		},
	}
	launch.init();

	const jump = {
		descent: 1,
		launchSegment: {
			points: [
				launch.straight,
				{
					center: { x:.5, y:1, z:0 },
					forward: negX,
					backwardWeight: 4,
				},
			],
		},
		radius: 2,

		_catchDrop: .1,
		_gap: 1,

		init: function() {
			const launchEnd = this.launchSegment.points[this.launchSegment.points.length - 1];
			this.catchStart = {
				center: {
					x: launchEnd.center.x - this._gap,
					y: launchEnd.center.y - this._catchDrop,
					z: launchEnd.center.z,
				},
				forward: negX,
			}
			this.catchEnd = {
				center: {
					x: this.catchStart.center.x - this.radius + this._gap / 2,
					y: this.catchStart.center.y - this.descent / 4,
					z: this.catchStart.center.z
				},
				forward: negX,
			}
			this.runout = {
				type: 'straight',
				length: 2 * this.radius,
			}
		},
	}
	jump.init();

	const parametricBank = [
		{ t:0, v:10 },
		{ t:1/3, v:23 },
		{ t:2/3, v:23 },
		{ t:1, v:10 },
	]

	//----------------------------------------------------------------------
	// Simple slope

	const track1 = tracks.register({
		family: "Simple slope",
		runoutStart: {
			center: zero,
			forward: negX,
			backwardWeight: 4,
		},
		runoutStraight: {
			type: 'straight',
			length: 2,
		},

		init: function() {
			this.track = {
				segments: [
					{
						points: [
							launch.start,
							launch.end,
							this.runoutStart,
							this.runoutStraight,
						],
					}
				],
			};
		}
	});
	const track1a = tracks.register({
		sibling: track1,
		member: 'Variable track width',
		runoutStraight: {
			type: 'straight',
			length: track1.runoutStraight.length,
			trackWidth: 2,
		},

		init: function() {
			this.track = {
				segments: [
					{
						points: [
							launch.start,
							launch.straight,
							track1.runoutStart,
							this.runoutStraight,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track1,
		member: "Alternate straight",
		track: {
			segments: [
				{
					points: [
						{
							type: 'straight',
							startsAt: launch.end.center,
							forward: launch.end.forward,
							length: 1.004987562112089,
							forwardWeight: 1.1
						},
						track1.runoutStart,
						track1a.runoutStraight,
					],
				},
			],
		},
	});

	//----------------------------------------------------------------------
	// Left turn ramp

	const track2 = tracks.register({
		family: "Left turn ramp",

		curveEnd: {
			backwardWeight: circleWeight * jump.radius,
			forward: posZ,
		},
		curveLeft: {
			backwardWeight: circleWeight * jump.radius,
			forward: posX,
			forwardWeight: circleWeight * jump.radius,
		},
		curveStart: {
			center: jump.catchEnd.center,
			forward: jump.catchEnd.forward,
			forwardWeight: circleWeight * jump.radius,
		},
		curveTop: {
			backwardWeight: circleWeight * jump.radius,
			forward: negZ,
			forwardWeight: circleWeight * jump.radius,
		},

		init: function() {
			this.curveTop.center = {
				x: this.curveStart.center.x - jump.radius,
				y: this.curveStart.center.y - jump.descent / 4,
				z: this.curveStart.center.z - jump.radius,
			}
			this.curveLeft.center = {
				x: this.curveTop.center.x + jump.radius,
				y: this.curveTop.center.y - jump.descent / 4,
				z: this.curveTop.center.z - jump.radius
			}
			this.curveEnd.center = {
				x: this.curveLeft.center.x + jump.radius,
				y: this.curveLeft.center.y - jump.descent / 4,
				z: this.curveLeft.center.z + jump.radius
			}
			this.track = {
				segments: [
					jump.launchSegment,
					{
						points: [
							jump.catchStart,
							this.curveStart,
							this.curveTop,
							this.curveLeft,
							this.curveEnd,
							jump.runout,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track2,
		member: "45&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					{
						center: track2.curveStart.center,
						forward: track2.curveStart.forward,
						forwardWeight: track2.curveStart.forwardWeight,
						trackBank: 10,
					},
					{
						backwardWeight: track2.curveTop.backwardWeight,
						center: track2.curveTop.center,
						forward: track2.curveTop.forward,
						forwardWeight: track2.curveTop.forwardWeight,
						trackBank: 45,
					},
					{
						backwardWeight: track2.curveLeft.backwardWeight,
						center: track2.curveLeft.center,
						forward: track2.curveLeft.forward,
						forwardWeight: track2.curveLeft.forwardWeight,
						trackBank: 45,
					},
					{
						backwardWeight: track2.curveEnd.backwardWeight,
						center: track2.curveEnd.center,
						forward: track2.curveEnd.forward,
						trackBank: 10,
					},
					jump.runout
				],
			}],
		},
	});
	tracks.register({
		sibling: track2,
		member: "Using spiral (cheat -.1)",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track2.curveEnd.center,
							forward: track2.curveEnd.forward,
						},
						rotate: 'left',
					},
					jump.runout
				],
			}],
			debug: true,
			altDeclination: -.1,
		},
	});
	tracks.register({
		sibling: track2,
		member: "Using spiral with 23&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track2.curveEnd.center,
							forward: track2.curveEnd.forward,
						},
						rotate: 'left',
						trackBank: parametricBank,
					},
					jump.runout
				],
			}],
		},
	});

	//----------------------------------------------------------------------
	// Right turn ramp

	const track3 = tracks.register({
		family: "Right turn ramp",

		curveEnd: {
			backwardWeight: circleWeight * jump.radius,
			forward: negZ,
		},
		curveRight: {
			backwardWeight: circleWeight * jump.radius,
			forward: posX,
			forwardWeight: circleWeight * jump.radius,
		},
		curveStart: track2.curveStart,
		curveTop: {
			backwardWeight: circleWeight * jump.radius,
			forward: posZ,
			forwardWeight: circleWeight * jump.radius,
		},

		init: function() {
			this.curveTop.center = {
				x: this.curveStart.center.x - jump.radius,
				y: this.curveStart.center.y - jump.descent / 4,
				z: this.curveStart.center.z + jump.radius,
			}
			this.curveRight.center = {
				x: this.curveTop.center.x + jump.radius,
				y: this.curveTop.center.y - jump.descent / 4,
				z: this.curveTop.center.z + jump.radius
			}
			this.curveEnd.center = {
				x: this.curveRight.center.x + jump.radius,
				y: this.curveRight.center.y - jump.descent / 4,
				z: this.curveRight.center.z - jump.radius
			}
			this.track = {
				segments: [
					jump.launchSegment,
					{
						points: [
							jump.catchStart,
							this.curveStart,
							this.curveTop,
							this.curveRight,
							this.curveEnd,
							jump.runout,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track3,
		member: "45&#176; bank",
		track: { segments: [
				jump.launchSegment,
				{ points: [
						jump.catchStart,
						{
							center: track3.curveStart.center,
							forward: track3.curveStart.forward,
							forwardWeight: track3.curveStart.forwardWeight,
							trackBank: -10,
						},
						{
							backwardWeight: track3.curveTop.backwardWeight,
							center: track3.curveTop.center,
							forward: track3.curveTop.forward,
							forwardWeight: track3.curveTop.forwardWeight,
							trackBank: -45,
						},
						{
							backwardWeight: track3.curveRight.backwardWeight,
							center: track3.curveRight.center,
							forward: track3.curveRight.forward,
							forwardWeight: track3.curveRight.forwardWeight,
							trackBank: -45,
						},
						{
							backwardWeight: track3.curveEnd.backwardWeight,
							center: track3.curveEnd.center,
							forward: track3.curveEnd.forward,
							trackBank: -10,
						},
						jump.runout
					]},
			]},
	});
	tracks.register({
		sibling: track3,
		member: "Using spiral",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track3.curveEnd.center,
							forward: track3.curveEnd.forward,
						},
						rotate: 'right',
					},
					jump.runout
				],
			}],
		},
	});
	tracks.register({
		sibling: track3,
		member: "Using spiral with 23&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track3.curveEnd.center,
							forward: track3.curveEnd.forward,
						},
						rotate: 'right',
						trackBank: parametricBank,
					},
					jump.runout
				],
			}],
		},
	});

	//----------------------------------------------------------------------
	// Loop

	tracks.register({
		family: "Loop",

		_offset: .4,
		_radius: 3,

		init: function() {
			const weight = circleWeight * this._radius;

			this.track = { segments: [ { points: [
						launch.start,
						launch.end,
					]}]};
			let p = this._pushPoint({	// End of slope, start of flat
				center: zero,
				forward: negX,
				backwardWeight: 4,
			});
			p = this._pushPoint({		// Entry into loop
				center: {
					x: p.center.x - this._radius,
					y: p.center.y,
					z: p.center.z
				},
				forward: negX,
				forwardWeight: weight,
			});
			p = this._pushPoint({		// First quarter of loop
				backwardWeight: weight,
				center: {
					x: p.center.x - this._radius,
					y: p.center.y + this._radius,
					z: p.center.z + this._offset,
				},
				forward: posY,
				forwardWeight: weight,
				trackBank: negX,
			});
			p = this._pushPoint({		// Top of loop
				backwardWeight: weight,
				center: {
					x: p.center.x + this._radius,
					y: p.center.y + this._radius,
					z: p.center.z + this._offset
				},
				forward: posX,
				forwardWeight: weight,
				trackBank: posY,
			});
			p = this._pushPoint({		// Last quarter of loop
				backwardWeight: weight,
				center: {
					x: p.center.x + this._radius,
					y: p.center.y - this._radius,
					z: p.center.z + this._offset
				},
				forward: negY,
				forwardWeight: weight,
				trackBank: posX,
			});
			p = this._pushPoint({		// Exit of loop
				backwardWeight: weight,
				center: {
					x: p.center.x - this._radius,
					y: p.center.y - this._radius,
					z: p.center.z + this._offset
				},
				forward: negX,
			});
			this._pushPoint({			// Runout
				type: 'straight',
				length: 2 * this._radius,
			});
		},

		_pushPoint: function(p) {
			this.track.segments[0].points.push(p);
			return p;
		},
	});

	//----------------------------------------------------------------------
	// Flat curves

	const track5 = tracks.register({
		family: "Flat curves",

		heights: [0, 2, 4],
		runoutLength: 1,

		_radius: 4,

		createPoint: function(segment, vertex, forward, weightsToSet) {
			const p = {
				center: {
					x: this._vertices[vertex].x,
					y: this.heights[segment],
					z: this._vertices[vertex].z
				},
				forward: forward
			};
			if (weightsToSet) {
				for (let key of weightsToSet) p[key] = this._weight;
			}
			return p;
		},
		pushPoint: function(segments, segment, vertex, forward, weightsToSet) {
			const p = typeof(vertex) === 'number' ?
					this.createPoint(segment, vertex, forward, weightsToSet) :
					vertex;
			segments[segment].points.push(p);
			return p;
		},

		init: function() {
			this._weight = this._radius * circleWeight;

			this._vertices = [];
			let v = this._pushVertex(this._radius, -this.runoutLength);
			v = this._pushVertex(v.x, v.z + this.runoutLength);
			v = this._pushVertex(v.x - this._radius, v.z + this._radius);
			v = this._pushVertex(v.x - this._radius, v.z - this._radius);
			this._pushVertex(v.x, v.z - this.runoutLength);

			const segments = [ { points: [] }, { points: [] } ];
			this.track = { segments: segments  };

			// Segment 0, left turn
			this.pushPoint(segments, 0, 0, posZ);
			this.pushPoint(segments, 0, 1, posZ, ['forwardWeight']);
			this.pushPoint(segments, 0, 2, negX, ['backwardWeight', 'forwardWeight']);
			this.pushPoint(segments, 0, 3, negZ, ['backwardWeight']);
			this.pushPoint(segments, 0, 4, negZ);

			// Segment 1, right turn
			this.pushPoint(segments, 1, 4, posZ);
			this.pushPoint(segments, 1, 3, posZ, ['forwardWeight']);
			this.pushPoint(segments, 1, 2, posX, ['backwardWeight', 'forwardWeight']);
			this.pushPoint(segments, 1, 1, negZ, ['backwardWeight']);
			this.pushPoint(segments, 1, 0, negZ);
		},

		_pushVertex: function(x, z) {
			const v = { x: x, z: z };
			this._vertices.push(v);
			return v;
		},
	});
	tracks.register({
		sibling: track5,
		member: "With spirals",

		init: function() {

			const runout = { type: 'straight', length: track5.runoutLength };

			const segments = [ track5.track.segments[0], { points: [] }, { points: [] } ];
			this.track = { segments: segments }

			// Segment 1, left spiral
			track5.pushPoint(segments, 1, 0, posZ);
			track5.pushPoint(segments, 1, runout);
			track5.pushPoint(segments, 1, {
				type: 'spiral',
				endsAt: track5.createPoint(1, 3, negZ),
				rotate: 'left',
			});
			track5.pushPoint(segments, 1, runout);

			// Segment 2, right spiral
			track5.pushPoint(segments, 2, 4, posZ);
			track5.pushPoint(segments, 2, runout);
			track5.pushPoint(segments, 2, {
				type: 'spiral',
				endsAt: track5.createPoint(2, 1, negZ),
				rotate: 'right',
			});
			track5.pushPoint(segments, 2, runout);
		},
	});

	//----------------------------------------------------------------------
	// Helixes

	const track6 = tracks.register({
		family: 'Helix',
		member: 'Left 360&#176; 4 turns (alt -.1)',
		track: {
			segments: [
				{
					points: [
						{
							type: 'spiral',
							startsAt: {
								center: { x: 0, y: 10, z: 0, },
								forward: posX,
							},
							endsAt: {
								center: zero,
								forward: posX,
							},
							rotate: 'left',
							turns: 4,
							center: { x:0, y:0, z:4 },
						},
					],
				}
			],
			debug: true,
			altDeclination: -.1,
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 360&#176; 1 turn (cheat -0.06)',
		track: {
			segments: [
				{
					points: [
						{
							type: 'spiral',
							startsAt: {
								center: { x: 0, y: 2, z: 0, },
								forward: posX,
							},
							endsAt: {
								center: zero,
								forward: posX,
							},
							rotate: 'left',
							turns: 1,
							center: { x:0, y:0, z:4 },
						},
					],
				}
			],
			debug: true,
			altDeclination: -0.06,
		},
	});
	const track6r = tracks.register({
		sibling: track6,
		member: 'Right 360&#176; 4 turns',
		init() {
			const p = track6.track.segments[0].points[0];
			this.track = { segments: [ { points: [
						{
							type: 'spiral',
							startsAt: p.startsAt,
							endsAt: p.endsAt,
							rotate: 'right',
							turns: p.turns,
							center: {
								x:-p.center.x,
								y:-p.center.y,
								z:-p.center.z
							},
						}
					]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 360&#176; 4 turns, 12 high',
		init() {
			const p = track6r.track.segments[0].points[0];
			this.track = { segments: [ { points: [
						{
							type: 'spiral',
							startsAt: {
								center: {x: p.startsAt.center.x, y: p.startsAt.center.y + 2, z: p.startsAt.center.z},
								forward: p.startsAt.forward
							},
							endsAt: p.endsAt,
							rotate: p.rotate,
							turns: p.turns,
							center: p.center,
						}
					]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 360&#176; 4 turns up',
		init() {
			const p = track6.track.segments[0].points[0];
			this.track = { segments: [ { points: [
						{
							type: 'spiral',
							startsAt: p.endsAt,
							endsAt: p.startsAt,
							rotate: p.rotate,
							turns: p.turns,
							center: p.center,
						}
					]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 90&#176; 6 turns',
		track: { segments: [ { points: [
					{
						type: 'spiral',
						startsAt: {
							center: { x: 4, y: 10, z: 0, },
							forward: posZ,
						},
						endsAt: {
							center: { x: 0, y: 0, z: 4, },
							forward: negX,
						},
						rotate: 'left',
						turns: 6,
					}
				]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 180&#176; 6 turns',
		track: { segments: [ { points: [
					{
						type: 'spiral',
						startsAt: {
							center: { x: -4, y: 10, z: 0, },
							forward: posZ,
						},
						endsAt: {
							center: { x: 4, y: 0, z: 0, },
							forward: negZ,
						},
						rotate: 'right',
						turns: 6,
					}
				]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 270&#176; 6 turns',
		track: { segments: [ { points: [
					{
						type: 'spiral',
						startsAt: {
							center: { x: 4, y: 10, z: 0, },
							forward: posZ,
						},
						endsAt: {
							center: { x: 0, y: 0, z: -4, },
							forward: posX,
						},
						rotate: 'left',
						turns: 6,
					}
				]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 315&#176; 6 turns (a)',
		track: {
			segments: [{
				points: [{
					type: 'spiral',
					startsAt: {
						center: { x: -4, y: 10, z: 0, },
						forward: posZ,
					},
					endsAt: {
						forward: { x: -1, y: 0, z: 1 },
					},
					rotate: 'right',
					turns: 6,
				}]
			}],
			debug:true,
		},
		init() {
			const theta = (180 + 45) * Math.PI / 180;
			const p = this.track.segments[0].points[0];
			p.endsAt.center = { x: 4 * Math.cos(theta), y: 0, z: 4 * Math.sin(theta) };
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 315&#176; 6 turns (b)',
		track: {
			segments: [{
				points: [
					{
						type: 'spiral',
						startsAt: {
							center: { x: -4, y: 10, z: 0, },
							forward: posZ,
						},
						rotate: 'right',
						turns: 6,
					},
					{
						type: 'spiral',
						endsAt: {
							forward: { x: -1, y: 0, z: 1 },
						},
						rotate: 'right',
					},
				]
			}],
			debug:true,
		},
		init() {
			const radius = 4;

			const p0 = this.track.segments[0].points[0];
			const p1 = this.track.segments[0].points[1];

			const wholeSweep = 315 + 360 * p0.turns;
			const p1Sweep = 90;
			const descent = p1Sweep / wholeSweep;

			const theta0 = -45 * Math.PI / 180;
			const radial0 = { x: Math.cos(theta0), y: 0, z: Math.sin(theta0) }
			p0.endsAt = {
				center: { x: radius * radial0.x, y: descent * p0.startsAt.center.y, z: radius * radial0.z },
				forward: { x: -1, y: -1 / wholeSweep, z: -1},
			}

			const theta1 = -135 * Math.PI / 180;
			p1.endsAt.center = { x: radius * Math.cos(theta1), y: 0, z: radius * Math.sin(theta1) };
		},
	});
}

//======================================================================
// WINDOW INITIALIZATION

window.initFunction = async function() {

	// Hook DOM elements
	errorDisplay.init("track-error", "track-error-text", [ "go" ]);
	altDeclinationDisplay.init("track-declination", "altDeclination");
	babylon.setCanvas("renderCanvas");
	tracks.setSelectors("trackFamilies", "trackMembers");
	ball.setButton("go");

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

	const Ammo = await ammo.bind(window)();

	babylon.startRenderLoop();
	window.scene = babylon.createScene();

	// Get tracks
	try {
		defineTracks();
		tracks.start();
	} catch (e) {
		errorDisplay.show(e);
	}
};
initFunction().then(() => { babylon.ready() });
window.addEventListener("resize", function () { babylon.resize() });
