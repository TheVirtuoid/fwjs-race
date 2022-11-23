import Vector3 from '../utilities/Vector3.js'
import startingGate from "./pieces/startingGate";
import Straight from "./pieces/Straight";
import Track from "./pieces/Track";
import Section from "./pieces/Section";

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
const startingGateSlope = 20;
const startingGateRiseRate = Math.tan(startingGateSlope * Math.PI / 180);
const startingGateLength = 2;


const trackStart = { x: 20, y:15, z: 0};

export function testTrack(tracks, cars, scene) {
	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;


	const gate = startingGate({
		slope: startingGateSlope,
		startingPosition: trackStart,
		cars,
		scene
	});

	const firstRun = Section.createStraight({ length: 40 });

	const jump = {
		descent: 1,
		launchSegment: {
			points: [
				gate.track.toObject(),
				{
					center: { x:-10, y:1, z:0 },
					// center: firstRun.end.center,
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
			trackBank: 23
		},
		curveTop: {
			backwardWeight: circleWeight * jump.radius,
			forward: negZ,
			forwardWeight: circleWeight * jump.radius,
			trackBank: 23
		},

		init: function() {
			this.curveTop.center = {
				x: this.curveStart.center.x - jump.radius,
				y: this.curveStart.center.y - jump.descent * 4,
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

			const points = [
				gate.track.start,
				gate.track.end,
				firstRun,
				// jump.catchStart,
				this.curveStart,
				this.curveTop,
				// this.curveLeft,
				// this.curveEnd,
				jump.runout,
			];
			this.track = {
				gate,
				checkPoints: [],
				segments: [
					{
						points
					},
				],
				options: { trackWidth },
			}
			points.forEach((point) => {
				if (point.center) {
					this.track.checkPoints.push(point.center);
				}
			});
		},
	});
}
