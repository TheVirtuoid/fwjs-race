import Vector3 from './race/utilities/Vector3.js'
import {Color3, MeshBuilder, Vector3 as BVector3} from "@babylonjs/core";

const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;

const negXnegY = new Vector3({ x: -1, y: -1, z: 0});

const negXnegZ = new Vector3({x: -1, y:0, z:-1 });
const negXposZ = new Vector3({x: -1, y:0, z:1 });
const posXnegZ = new Vector3({x: 1, y:0, z:-1 });
const posXposZ = new Vector3({x: 1, y:0, z:1 });

// See https://spencermortensen.com/articles/bezier-circle/
// If we want a closer approximation, we would need to break the
// convention that backward = -forward and allow backward to be
// forward rotated 180 degrees around down.
const circleWeight = 0.5519150244935105707435627;

const trackWidth = 4;					// width of the track
const wallHeight = .5;				// height of the wall
// const trackRadius = 8				// fixed radius of a curve
// const curveRadius = trackRadius * circleWeight;		// radius applied to curves
const family = 'TestTrack';		// family grouping in which the track belongs

const next = (start, change) => {
	return new Vector3({
		x: start.center.x + change.x,
		y: start.center.y + change.y,
		z: start.center.z + change.z
	});
}

// const trackStart = new Vector3({x: 20, y:15, z: 0});


/*const startingGate = {
	start: {
		center: trackStart,
		forward: new Vector3({ x: -1, y: -1, z:0 }),
	},
	end: {
		center: {},
		forward: new Vector3({ x: -1, y: -1, z:0 }),
	},
	init: () => {
		startingGate.end.center = next(startingGate.start, { x: -10, y: -5, z: 0 });
	},
	build: (scene) => {
		const black = Color3.Black().toColor4();
		const faceColors = [black, black, black, black, black, black]
		const lowerGate = MeshBuilder.CreateBox('lowerGate', {
			width: .5, height: 1, depth: trackWidth, faceColors
		}, scene);
		const { x, y, z } = startingGate.end.center;
		lowerGate.position = new BVector3(x, y + .5, z);
		const upperGate = MeshBuilder.CreateBox('upperGate', {
			width: .5, height: 1, depth: trackWidth, faceColors
		}, scene);
		upperGate.position = new BVector3(x + 5, y + 3, z);
	}
}*/

// startingGate.init();

/* ----------------------------------- TRACK LAYOUT --------------------------- */
const trackStart = {
	center: new Vector3({ x: 20, y:15, z: 0 }),
	forward: negX
}

const curve45Radius = trackWidth * 4;
const curve45Weight = curve45Radius * circleWeight;

const firstSlope = {
	center: next(trackStart, { x: -40, y: -20, z: 0}),
	forward: negX,
	backwardWeight: 10,
	forwardWeight: curve45Weight
}

const curve45 = {
	center: next(firstSlope, {x: -curve45Radius, y: 0, z: -curve45Radius}),
	forward: negZ,
	backwardWeight: curve45Radius,
	trackBank: 45
}

const curve45Landing = {
	center: next(curve45, { x: 0, y: 0, z: -10 }),
	forward: negZ,
	forwardWeight: 20
}

const curve180Radius = trackWidth * 4;
const curve180Weight = curve180Radius * circleWeight;

const secondSlope = {
	center: next(curve45Landing, { x: 0, y: -30, z: -60 }),
	forward: negZ,
	forwardWeight: curve180Weight,
	backwardWeight: 20
}

const curve180_1 = {
	center: next(secondSlope, { x: curve180Radius, y: 0, z: -curve180Radius }),
	forward: posX,
	backwardWeight: curve180Weight,
	forwardWeight: curve180Weight,
	trackBank: 45
}

const curve180_2 = {
	center: next(curve180_1, { x: curve180Radius, y: 0, z: curve180Radius }),
	forward: posZ,
	backwardWeight: curve180Weight,
	trackBank: 45
}

const curve180Landing = {
	center: next(curve180_2, { x: 0, y: 0, z: 10 }),
	forward: posZ,
	forwardWeight: 10
}

const finalSlope = {
	center: next(curve180Landing, { x: 0, y: -10, z: 40  }),
	forward: posZ,
	backwardWeight: 10
}

const finishLine = {
	center: next(finalSlope, { x: 0, y: 0, z: 20 }),
	forward: posZ
}



/*const midSlope = {
	center: next(firstSlope, { x: -10, y: -5, z: 0}),
	// forward: negX,
	forward: new Vector3({ x: -1, y: -1, z:0 })
}*/
/*
const endSlope = {
	center: new Vector3(-15, -1, 0),
	forward: negX,
	backwardWeight: 10
}
*/
/*
const endSlope = {
	center: next(startingGate.end, {x: -35, y: -16, z:0 }),
	forward: negX,
	backwardWeight: 10
}

const nextSlope = {
	center: next(endSlope, { x:-5, y: 0, z:0 }),
	forward: negX,
}
*/


/* ----------------------------------- curve definition ------------------------------------ */
/*
const curveStart = {
	center: next(nextSlope, {x: -1, y: 0, z:0 }),
	forward: negX,
	forwardWeight: curveRadius,
};

const curveMiddle = {
	backwardWeight: curveRadius,
	forward: negZ,
	center: next(curveStart, {x: -trackRadius, y: 0, z: -trackRadius })
};


const curveEnd = {
	forward: negZ,
	center: next(curveMiddle, {x: 0, y: 0, z: -5 }),
	forwardWeight: 10
};

const middleStraight = {
	center: next(curveEnd, { x: 0, y: -20, z: -40 }),
	forward: negZ,
	backwardWeight: 15
}
*/

/*----------------------------- 180 curve ----------------------- */
/*
const curve180start = {
	center: next(middleStraight, { x: 0, y: 0, z: -10 }),
	forward: negZ,
	forwardWeight: curveRadius,
};
const curve180Middle1 = {
	backwardWeight: curveRadius,
	forward: posX,
	center: next(curve180start, { x: trackRadius, y: 0, z: -trackRadius })
};
const curve180Middle2 = {
	backwardWeight: trackRadius,
	forward: posZ,
	center: next(curve180Middle1, { x: trackRadius, y: 0, z: trackRadius })
};
const curve180End = {
	forward: posZ,
	forwardWeight: 10,
	center: next(curve180Middle2, { x: 0, y: 0, z: 5 })
};

const finalSlope = {
	forward: posZ,
	center: next(curve180End, { x: 0, y: -5, z: 40 })
};

const finishLine = {
	forward: posZ,
	backwardWeight: 10,
	center: next(finalSlope, { x: 0, y: 0, z: 20 })
}
*/


export function testTrackLive(tracks, scene) {
	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;

	// startingGate.build(scene);

	const track1 = tracks.register({
		family,
		init: function() {
			this.track = {
				last: finalSlope.center,
				segments: [
					{
						points: [
								trackStart,
								firstSlope,
								curve45,
								curve45Landing,
								secondSlope,
								curve180_1,
								curve180_2,
								curve180Landing,
								finalSlope,
								finishLine

							//firstSlope,
								//midSlope,
/*								startingGate.start,
								startingGate.end,
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
								finishLine*/
						],
					},
				],
				options: { trackWidth, wallHeight },
			};
		}
	});
}
