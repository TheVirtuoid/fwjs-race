import Vector3 from '../utilities/Vector3.js'
import startingGate from "./pieces/startingGate";
import Straight from "./pieces/Straight";
import Track from "./pieces/Track";
import Section from "./pieces/Section";
import finishLine from "./pieces/finishLine";

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
const trackRadius = trackWidth * radiusType.get('normal');

// slope definitions
const startingGateSlope = 55;
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

	const curve = {
		backwardWeight: circleWeight * trackRadius,
		forward: negZ,
		forwardWeight: circleWeight * trackRadius,
		trackBank: 23,
		center: {
			x: -30,
			y: -5,
			z: -20
		},
	};

	const secondStraight = {
		center: {
			x: -30,
			y: -30,
			z: -100
		},
		forward: negZ,
		backwardWeight: 4
	}

	const secondCurve = {
		forward: posZ,
		forwardWeight: circleWeight * trackRadius,
		backwardWeight: circleWeight * trackRadius,
		center: {
			x: -30 + trackRadius * 2,
			y: -40,
			z: -200
		}
	}

	const finish = finishLine({
		startsAt: {x: -110, y: -10, z: 0},
		scene
	});



	const track1 = tracks.register({
		family: "Simple slope",
		runoutStart: {
			center: zero,
			forward: negX,
			backwardWeight: 10,
		},
		runoutStraight: {
			type: 'straight',
			endsAt: {
				x: -15,
				y: -1,
				z: 0
			},
			/* length: 15, */
		},
		secondDip: {
			center: {
				x: -70,
				y: -10,
				z: 0
			},
			forward: negX,
			backwardWeight: 5,
			forwardWeight: .01
		},
		secondStraight: {
			type: 'straight',
			forward: negX,
			startsAt: {
				x: -70,
				y: -10,
				z: 0
			},
			length: 30
		},

		init: function() {
			this.track = {
				gate,
				segments: [
					{
						points: [
							gate.track.start,
							gate.track.end,
							this.runoutStart,
							this.runoutStraight,
							this.secondDip
						],
					},
					{
						physicsOptions: {
							friction: 1000
						},
						points: [
								this.secondStraight,
								finish.track
						]
					}
				],
				options: { trackWidth },
			};
		}
	});



}
