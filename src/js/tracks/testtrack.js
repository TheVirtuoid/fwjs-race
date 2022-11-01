import Vector3 from '../Vector3.js'
import startingGate from "./pieces/startingGate";

const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;

const radiusType = new Map([
		['tight', 2],
		['normal', 4],
		['wide', 8]
])

const trackWidth = 4;
const trackRadius = trackWidth * radiusType.get('wide');

// slope definitions
const startingGateSlope = 55;
const startingGateRiseRate = Math.tan(startingGateSlope * Math.PI / 180);
const startingGateLength = 2;

// first run
const firstRunSlope = 55;
const firstRunRiseRate = Math.tan(firstRunSlope * Math.PI / 180);
const firstRunLength = 40;

const trackStart = { x: 20, y:15, z: 0};

export function testTrack(tracks) {

	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;


	//----------------------------------------------------------------------
	// Common launch and jump points


	const launch = {
		start: {
			center: trackStart
		},
		end: {
			center: {
				x: trackStart.x - startingGateLength,
				y: trackStart.y - startingGateLength * startingGateRiseRate,
				z: 0
			}
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
				forwardWeight: 1.1,
			};
		},
	}
	launch.init();

/*	const launch = startingGate({
		slope: startingGateSlope,
		startingPosition: trackStart,
		cars: [
			{ length: 1 },
			{ length: 1 },
			{ length: 1 },
			{ length: 1 }
		]
	});*/

	const jump = {
		descent: 1,
		launchSegment: {
			points: [
				launch.straight,
				{
					center: { x:-10, y:1, z:0 },
					forward: negX,
					backwardWeight: 1,
				},
			],
		},
		radius: trackRadius,

		_catchDrop: 0,
		_gap: 0,

		init: function() {
			const launchEnd = this.launchSegment.points[this.launchSegment.points.length - 1];
			this.catchStart = {
				center: {
					x: launchEnd.center.x - this.descent / 4,
					y: launchEnd.center.y - this.descent / 4,
					z: launchEnd.center.z,
				},
				forward: negX,
				backwardWeight: 3,
			}
			this.catchEnd = {
				center: {
					x: this.catchStart.center.x - this.radius,
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
	// Left turn ramp

	const track2 = tracks.register({
		trackId: 'test-track',
		family: 'Test Track',

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
				y: this.curveStart.center.y - jump.descent * 2,
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
					{
						points: [
							launch.start,
							launch.end,
							jump.catchStart,
							this.curveStart,
							this.curveTop,
							// this.curveLeft,
							// this.curveEnd,
							jump.runout,
						],
					},
				],
				options: { trackWidth },
			}
		},
	});
	tracks.register({
		sibling: track2,
		member: "45&#176; bank",
		track: {
			options: { trackWidth },
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					{
						center: track2.curveStart.center,
						forward: track2.curveStart.forward,
						forwardWeight: track2.curveStart.forwardWeight,
						trackBank: 10
					},
					{
						backwardWeight: track2.curveTop.backwardWeight,
						center: track2.curveTop.center,
						forward: track2.curveTop.forward,
						forwardWeight: track2.curveTop.forwardWeight,
						trackBank: 45
					},
/*					{
						backwardWeight: track2.curveLeft.backwardWeight,
						center: track2.curveLeft.center,
						forward: track2.curveLeft.forward,
						forwardWeight: track2.curveLeft.forwardWeight,
						trackBank: 45,
						trackWidth
					},
					{
						backwardWeight: track2.curveEnd.backwardWeight,
						center: track2.curveEnd.center,
						forward: track2.curveEnd.forward,
						trackBank: 10,
						trackWidth
					},*/
					jump.runout
				],
			}],
		},
	});
	tracks.register({
		sibling: track2,
		member: "Using spiral (cheat -.1)",
		track: {
			options: { trackWidth },
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track2.curveEnd.center,
							forward: track2.curveEnd.forward
						},
						rotate: 'left',
					},
					jump.runout
				],
			}],
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

}
