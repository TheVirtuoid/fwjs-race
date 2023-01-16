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
import "@babylonjs/loaders";


const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;


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


const addStartingGate = (firstPoint, secondPoint, carLength, scene) => {
	const black = Color3.Black().toColor4();
	const faceColors = [black, black, black, black, black, black];
	const carGap = .5;
	const gateWidth = .5;
	const gateHeight = 1.5;
	const gateGap = carGap + carLength + gateWidth / 2;

	const { x: fpx, y: fpy, z: fpz } = firstPoint.center;
	const { x: spx, y: spy, z: spz } = secondPoint.center;

	const xDiff = fpx - spx;
	const zDiff = fpz - spz;
	const yDiff = fpy - spy;

	const run = Math.sqrt(firstPoint.forward.x ? xDiff * xDiff : zDiff * zDiff);
	const ySlope = Math.abs( Math.sqrt(yDiff * yDiff)) / run;

	/* support for dropCars */
	let raceStarted = false;


	// upper gate is placed firstPoint + carLength + carGap + gateWidth / 2;
	const upperGate = MeshBuilder.CreateBox('upperGate', { width: gateWidth, height: gateHeight, depth: trackWidth, faceColors }, scene);
	upperGate.position = new BVector3(
			firstPoint.center.x + gateGap * firstPoint.forward.x,
			firstPoint.center.y - ySlope * gateGap ,
			firstPoint.center.z + gateGap * firstPoint.forward.z
	);
	upperGate.physicsImpostor = new PhysicsImpostor(upperGate, PhysicsImpostor.BoxImpostor, { friction: 50, mass: 0, restitution: 0 });


	const lowerGate = MeshBuilder.CreateBox('lowerGate', { width: gateWidth, height: gateHeight, depth: trackWidth, faceColors }, scene);
	lowerGate.position = new BVector3(
			firstPoint.center.x + gateGap * 2 * firstPoint.forward.x,
			firstPoint.center.y - ySlope * (gateGap * 2 + gateWidth),
			firstPoint.center.z + gateGap * 2 * firstPoint.forward.z
	);
	lowerGate.physicsImpostor = new PhysicsImpostor(lowerGate, PhysicsImpostor.BoxImpostor, { friction: 50, mass: 0, restitution: 0 });

	const dropCars = (cars) => {
		if (raceStarted) {
			upperGate.position.y += gateHeight;
			lowerGate.position.y += gateHeight;
		}
		cars.forEach((car) => {
			car.junk();
			const slot = car.slot - 1;
			const slotPositionShift = slot % 2 === 0 ? trackWidth / 4 : trackWidth / 4 * -1;
			// const carLengthPositionShift = carLength / 2 + gateGap;
			const carLengthPositionShift = carLength / 2 + carGap;
			const rotate = Math.atan(Math.abs(yDiff) / run);
			const rToRads = rotate * 180 / Math.PI;
			console.log(`ydiff, run, rotate, rToRads = ${yDiff}, ${run}, ${rotate}, ${rToRads}`);
			const position = slot <= 1 ? lowerGate.position.clone() : upperGate.position.clone();

			// this sets the position based upon the slot (perpendicular to the track)
			position.x += slotPositionShift * firstPoint.forward.z;
			position.z += slotPositionShift * firstPoint.forward.x;

			// this sets the position based upon the car length (parallel to the track);
			position.x -= carLengthPositionShift * firstPoint.forward.x;
			position.z -= carLengthPositionShift * firstPoint.forward.z;

			// this sets the Y position (regardless of the slot)
			position.y += carLengthPositionShift * ySlope + .5;

			// build the car!
			// car.build({ rotate: rToRads, position, scene });
			car.build({ position, scene });
			car.adjustRotation(firstPoint.forward, rToRads);
			// wheelBase.rotate(new Vector3(0, 1, 0), rotate);

		});
	}

	const startRace = () => {
		return new Promise((resolve, reject) => {
			lowerGate.position.y -= gateHeight;
			upperGate.position.y -= gateHeight;
			setTimeout(() => {
				resolve(true);
			}, 3000);
		});
	}

	return { dropCars, startRace };
};

const addFinishGate = (nextToLastPoint, lastPoint, scene) => {
	// two pieces to the finish gate
	//		1. The hard-stop at the end of the track (called 'stop')
	//		2. The finish line itself (with green marker line and checkerboard gate)

	// the stop gate
	const stopDepth = .25;
	const stopColor = Color3.Black().toColor4();
	const stopOptions = {
		height: 3,
		depth: stopDepth,
		width: trackWidth,
		faceColors: [stopColor, stopColor, stopColor, stopColor, stopColor, stopColor]
	}
	const stopGate = MeshBuilder.CreateBox('stopGate', stopOptions, scene);
	stopGate.position = new BVector3(
			lastPoint.center.x + stopDepth / 2 * lastPoint.forward.x,
			lastPoint.center.y,
			lastPoint.center.z + stopDepth / 2 * lastPoint.forward.z
	);
	stopGate.physicsImpostor = new PhysicsImpostor(stopGate, PhysicsImpostor.BoxImpostor, { friction: 5000, mass: 0, restitution: 0 });


	// the finish line
	const finishLineMaterial = new StandardMaterial('finish-line', scene);
	finishLineMaterial.diffuseTexture = new Texture('/models/textures/checkerboard.jpg');

	const gateHeight = 4;
	const gateDepth = .25;
	const gateWidth = 1;

	const finishLineLeft = MeshBuilder.CreateBox('finishLineLeft', { height: gateHeight, depth: gateDepth, width: gateWidth }, scene);
	finishLineLeft.material = finishLineMaterial;
	finishLineLeft.position = new BVector3(
			nextToLastPoint.center.x + trackWidth * (nextToLastPoint.forward.z * -1),
			nextToLastPoint.center.y + gateHeight / 2,
			nextToLastPoint.center.z + trackWidth * (nextToLastPoint.forward.x * -1)
	);

	const finishLineRight = MeshBuilder.CreateBox('finishLineRight', { height: gateHeight, depth: gateDepth, width: gateWidth }, scene);
	finishLineRight.material = finishLineMaterial;
	finishLineRight.position = new BVector3(
			nextToLastPoint.center.x + trackWidth * nextToLastPoint.forward.z,
			nextToLastPoint.center.y + gateHeight / 2,
			nextToLastPoint.center.z + trackWidth * nextToLastPoint.forward.x);

	const finishLineTop = MeshBuilder.CreateBox('finishLineTop', { height: gateWidth, depth: gateDepth, width: trackWidth * 2 }, scene);
	finishLineTop.material = finishLineMaterial;
	finishLineTop.position = new BVector3(
			nextToLastPoint.center.x,
			nextToLastPoint.center.y + gateHeight,
			nextToLastPoint.center.z);

	const directionVectorOrigin = new BVector3(
			finishLineLeft.position.x,
			finishLineLeft.position.y - gateHeight / 2 + wallHeight,
			finishLineLeft.position.z
	);
	const directionVectorTerminator = new BVector3(
			finishLineRight.position.x,
			finishLineRight.position.y - gateHeight / 2 + wallHeight,
			finishLineRight.position.z
	);
	const directionVector = directionVectorTerminator.subtract(directionVectorOrigin);

	const finishLine = MeshBuilder.CreateLines('test',
			{
				colors: [ Color3.Green().toColor4(), Color3.Green().toColor4()],
				points: [directionVectorOrigin, directionVectorTerminator]
			},
			scene);

	const crossedFinishLine = (carMeshes = []) => {
		const origin = directionVectorOrigin;
		const direction = directionVector;
		const length = 10;
		const ray = new Ray(origin, direction, length);
		return ray.intersectsMeshes(carMeshes);
	}

	return { crossedFinishLine };
};


/* ----------------------------------- TRACK LAYOUT --------------------------- */
const trackStart = {
	center: new Vector3({ x: 20, y:15, z: 0 }),
	forward: negX
}

const curve45Radius = trackWidth * 8;
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
	trackBank: 23
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

export function testTrackLive(tracks, cars, scene) {

	const carLength = [...cars].reduce((carLength, car) => {
		return Math.max(carLength, car.length);
	}, -1);

	const { dropCars, startRace } = addStartingGate(trackStart, firstSlope, carLength, scene);
	const { crossedFinishLine } = addFinishGate(finalSlope, finishLine, scene);

	const track1 = tracks.register({
		family,
		init: function() {
			this.track = {
				last: finalSlope.center,
				dropCars,
				crossedFinishLine,
				startRace,
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
