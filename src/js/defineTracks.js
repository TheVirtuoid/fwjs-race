import Vector3 from './Vector3.js'

const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;

export function defineTracks(tracks) {

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
	const trackError = tracks.register({
		family: 'Error',
		member: 'Section name',
		track: {
			segments: [
				{
					points: [
						{
							type: 'oops',
						},
					],
				}
			],
			altDeclination: -0.06,
		},
	});
}
