import Vector3 from './race/utilities/Vector3.js'
import {
	Color3,
	MeshBuilder,
	PhysicsImpostor,
	Ray,
	StandardMaterial,
	Texture,
	Vector3 as BVector3
} from "@babylonjs/core";
import Section from "./race/tracks/pieces/Section";

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

const toRadians = (degrees) => {
	return degrees * Math.PI / 180;
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

const addStartingGate = (firstPoint, secondPoint, carLength, scene) => {
	const black = Color3.Black().toColor4();
	const faceColors = [black, black, black, black, black, black];
	const carGap = .25;
	const gateWidth = .5;
	const gateGap = carGap + carLength;
	const run = Math.max(Math.abs(firstPoint.center.x - secondPoint.center.x), Math.abs(firstPoint.center.z - secondPoint.center.z));
	const ySlope = Math.abs(firstPoint.center.y - secondPoint.center.y) / run;
	const upperGate = MeshBuilder.CreateBox('upperGate', { width: gateWidth, height: 1, depth: trackWidth, faceColors }, scene);
	const lowerGate = MeshBuilder.CreateBox('lowerGate', { width: gateWidth, height: 1, depth: trackWidth, faceColors }, scene);
	const upperGatePosition = new BVector3(
			firstPoint.center.x + gateGap * firstPoint.forward.x,
			firstPoint.center.y - ySlope * gateGap ,
			firstPoint.center.z + gateGap * firstPoint.forward.z
	);
	const lowerGatePosition = new BVector3(
			firstPoint.center.x + (gateGap * firstPoint.forward.x * 2) + gateWidth * firstPoint.forward.x,
			firstPoint.center.y - ySlope * (gateGap * 2 + gateWidth),
			firstPoint.center.z + (gateGap * firstPoint.forward.z * 2) + gateWidth * firstPoint.forward.z
	);
	upperGate.position = upperGatePosition;
	lowerGate.position = lowerGatePosition;
};

const addFinishGate = (nextToLastPoint, lastPoint, scene) => {
	const stopWidth = .25;
	const stopColor = Color3.Black().toColor4();
	const stopOptions = {
		height: 3,
		depth: trackWidth,
		width: stopWidth,
		faceColors: [stopColor, stopColor, stopColor, stopColor, stopColor, stopColor]
	}
	const stopGate = MeshBuilder.CreateBox('stopGate', stopOptions, scene);
	stopGate.position = new BVector3(
			lastPoint.center.x,
			lastPoint.center.y,
			lastPoint.center.z
	);
	stopGate.physicsImpostor = new PhysicsImpostor(stopGate, PhysicsImpostor.BoxImpostor, { friction: 5000, mass: 0, restitution: 0 });

	const finishLineMaterial = new StandardMaterial('finish-line', scene);
	finishLineMaterial.diffuseTexture = new Texture('/models/textures/checkerboard.jpg');

	const finishLineLeft = MeshBuilder.CreateBox('finishLineLeft', { height: 4, depth: 1, width: stopWidth }, scene);
	finishLineLeft.material = finishLineMaterial;
	finishLineLeft.position = new BVector3(
			nextToLastPoint.center.x,
			nextToLastPoint.center.y + 2,
			nextToLastPoint.center.z - 4
	);

	const finishLineRight = MeshBuilder.CreateBox('finishLineRight', { height: 4, depth: 1, width: stopWidth }, scene);
	finishLineRight.material = finishLineMaterial;
	finishLineRight.position = new BVector3(
			nextToLastPoint.center.x,
			nextToLastPoint.center.y + 2,
			nextToLastPoint.center.z + 4);

	const finishLineTop = MeshBuilder.CreateBox('finishLineTop', { height: 1, depth: 8, width: stopWidth }, scene);
	finishLineTop.material = finishLineMaterial;
	finishLineTop.position = new BVector3(
			nextToLastPoint.center.x,
			nextToLastPoint.center.y + 4,
			nextToLastPoint.center.z);

	const directionVectorOrigin = new BVector3(
			finishLineLeft.position.x,
			finishLineLeft.position.y - 1.5,
			finishLineLeft.position.z
	);
	const directionVectorTerminator = new BVector3(
			finishLineRight.position.x,
			finishLineRight.position.y - 1.5,
			finishLineRight.position.z
	);
	const directionVector = directionVectorTerminator.subtract(directionVectorOrigin);

	const finishLine = MeshBuilder.CreateLines('test',
			{
				colors: [ Color3.Green().toColor4(), Color3.Green().toColor4()],
				points: [directionVectorOrigin, directionVectorTerminator]
			},
			scene);

	finishLineTop.addChild(finishLineLeft);
	finishLineTop.addChild(finishLineRight);
	finishLineTop.addChild(finishLine);

	finishLineTop.rotate(BVector3.Up(), toRadians(90));
	stopGate.rotate(BVector3.Up(), toRadians(90));

	const finished = (carMeshes = []) => {
		let gotAHit = { marker: false, other: false };
		const origin = directionVectorOrigin;
		const direction = directionVector;
		const length = 10;
		const ray = new Ray(origin, direction, length);
		const meshHit = ray.intersectsMeshes(carMeshes);
		return meshHit;
	}


	/*finishLine.track = Section.createStraight({ length: 3, physicsOptions: { friction: 1 } });
	finishLine.finished = finished;
	return finishLine;*/
};


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

export function testTrackLive(tracks, scene) {
	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;

	addStartingGate(trackStart, firstSlope, 3, scene);
	addFinishGate(finalSlope, finishLine, scene);

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
						],
					},
				],
				options: { trackWidth, wallHeight },
			};
		}
	});
}
