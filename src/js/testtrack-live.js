import Vector3 from './race/utilities/Vector3.js'

const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;

const negXnegZ = new Vector3({x: -1, y:0, z:-1 });
const negXposZ = new Vector3({x: -1, y:0, z:1 });
const posXnegZ = new Vector3({x: 1, y:0, z:-1 });
const posXposZ = new Vector3({x: 1, y:0, z:1 });

console.log(posX, negX, posY, negY, posZ, negZ);

const circleWeight = 0.5519150244935105707435627;

const trackWidth = 4;					// width of the track
const wallHeight = .5;				// height of the wall
const trackRadius = 8				// fixed radius of a curve
const curveRadius = trackRadius * circleWeight;		// radius applied to curves
const family = 'TestTrack';		// family grouping in which the track belongs


const trackStart = new Vector3({x: 20, y:15, z: 0});

const firstSlope = {
	center: trackStart,
	forward: negX,
}

const endSlope = {
	center: new Vector3(-15, -1, 0),
	forward: negX,
	backwardWeight: 10
}

const nextSlope = {
	center: new Vector3(-20, -1, 0),
	forward: negX,
}


/* ----------------------------------- curve definition ------------------------------------ */
const curveStart = {
	center: new Vector3(-21, -1, 0),
	forward: negX,
	forwardWeight: curveRadius,
};

const curveMiddle = {
	backwardWeight: curveRadius,
	forward: negZ,
	// forwardWeight: curveRadius,
	center: {
		x: curveStart.center.x - trackRadius,
		y: curveStart.center.y,
		z: curveStart.center.z - trackRadius
	}
};


const curveEnd = {
	forward: negZ,
	center: {
		x: curveMiddle.center.x,
		y: curveMiddle.center.y,
		z: curveMiddle.center.z - 5
	},
	forwardWeight: 10
};

const middleStraight = {
	center: {
		x: curveEnd.center.x,
		y: curveEnd.center.y - 20,
		z: curveEnd.center.z - 40
	},
	forward: negZ,
	backwardWeight: 15
}
console.log(`curveRadius: ${curveRadius}`);
/*----------------------------- 180 curve ----------------------- */
const curve180start = {
	center: {
		x: middleStraight.center.x,
		y: middleStraight.center.y,
		z: middleStraight.center.z - 10
	},
	forward: negZ,
	forwardWeight: curveRadius,
};
const curve180Middle1 = {
	backwardWeight: curveRadius,
	forward: posX,
	center: {
		x: curve180start.center.x + trackRadius,
		y: curve180start.center.y,
		z: curve180start.center.z - trackRadius
	}
};
const curve180Middle2 = {
	backwardWeight: trackRadius,
	forward: posZ,
	center: {
		x: curve180Middle1.center.x + trackRadius,
		y: curve180Middle1.center.y,
		z: curve180Middle1.center.z + trackRadius
	}
};
const curve180End = {
	forward: posZ,
	forwardWeight: 10,
	center: {
		x: curve180Middle2.center.x,
		y: curve180Middle2.center.y,
		z: curve180Middle2.center.z + 5
	}
};


const finalSlope = {
	forward: posZ,
	center: {
		x: curve180End.center.x,
		y: curve180End.center.y - 5,
		z: curve180End.center.z + 40
	}
};

const finishLine = {
	forward: posZ,
	backwardWeight: 10,
	center: {
		x: finalSlope.center.x,
		y: finalSlope.center.y,
		z: finalSlope.center.z + 20
	}
}


export function testTrackLive(tracks, scene) {
	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;

	const track1 = tracks.register({
		family,
		init: function() {
			this.track = {
				last: finalSlope.center,
				segments: [
					{
						points: [
							firstSlope,
							endSlope,
							nextSlope,
							curveStart,
								curveMiddle,
								curveEnd,
								middleStraight,
								curve180start,
								curve180Middle1,
								curve180Middle2,
								curve180End,
								finalSlope,
								finishLine
						],
					},
				],
				options: { trackWidth, wallHeight },
			};
		}
	});



}

/*
export function testTrackLive(tracks, scene) {
	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;


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

	const track1 = tracks.register({
		family,
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
				segments: [
					{
						points: [
							this.runoutStart,
							this.runoutStraight
						],
					},
				],
				options: { trackWidth },
			};
		}
	});



}

*/
