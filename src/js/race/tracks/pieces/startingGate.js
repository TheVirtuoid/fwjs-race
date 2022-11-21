import Straight from "./Straight";
import {Color3, MeshBuilder, PhysicsImpostor, Vector3} from "@babylonjs/core";
import Section from "./Section";
import Segment from "./Segment";

const gateWidth = .25;
const carSpacing = .25;

/*export default (args = {}) => {
	const { cars, startingPosition } = args;

	const lowerSectionCars = [...cars].filter((car) => car.slot <= 2);
	const upperSectionCars = [...cars].filter((car) => car.slot >= 3);

	const upperSectionLength = Math.max(...upperSectionCars.map((car) => car.length));
	const lowerSectionLength = Math.max(...lowerSectionCars.map((car) => car.length));

	const upperSection = Section.createStraight({
		startsAt: startingPosition,
		length: upperSectionLength
	});


	const gate = new Section();
	gate.addPoint(upperSection);
	console.log(gate.toObject());
	return gate.toObject();
}*/


export default (args) => {
	const { slope, startingPosition, cars, scene } = args;

	const rows = [];
	const gateWidth = .25;
	const spacing = .25;
	const riseRate = Math.tan(slope * Math.PI / 180);
	let maxCarLength = -1;
	let length = 0;
	cars.forEach((car) => {
		const slot = car.slot - 1;
		maxCarLength = Math.max(maxCarLength, car.length);
		if (slot % 2 !== 0) {
			rows.push(maxCarLength);
			length += maxCarLength;
			maxCarLength = -1;
		}
	});
	length += gateWidth * rows.length + spacing * rows.length;
	const start = { center: startingPosition };
	const end = {
		center: {
			x: startingPosition.x - length,
			y: startingPosition.y - length * riseRate,
			z: startingPosition.z
		}
	}

	const dropCars = () => {
		gateFront.position.y += 1;
		gateBack.position.y += 1;
		cars.forEach((car) => {
			const slot = car.slot - 1;
			const rotate = slope;
			car.junk();
			let x, y;
			const z = end.center.z + (slot % 2 === 0 ? -car.width/2 - .25 : car.width/2 + .25);
			if (slot <= 1) {
				x = end.center.x + car.length / 2 + .25;
				y = end.center.y + (car.length + gateWidth) * riseRate;
			} else {
				x = end.center.x + car.length + gateWidth * 2 + spacing * 4 + .25;
				y = end.center.y + (car.length * 2 + gateWidth * 2) * riseRate;
			}
			car.build({ rotate, position: new Vector3(x, y, z), scene });
		});
	};

	const startRace = () => {
		return new Promise((resolve, reject) => {
			cars.forEach((car) => {
				const slot = car.slot - 1;
				// const distance = slot <= 1 ? 0 : Vector3.Distance(car.position, cars[slot - 2].position) * -1;
				// car.resetDistanceTravelled(distance);
			});
			gateBack.position.y -= 1;
			gateFront.position.y -= 1;
			setTimeout(() => {
				resolve(true);
			}, 3000);
		});
	}

	const gate = {};
	gate.track = new Straight({ start, end, forwardWeight: 1.1 });
	gate.dropCars = dropCars;
	gate.startRace = startRace;


	const gateColor = new Color3.Black().toColor4();
	const gateOptions = {
		height: .5,
		depth: 3,
		width: gateWidth,
		faceColors: [gateColor, gateColor, gateColor, gateColor, gateColor, gateColor]
	}
	const gateFront = MeshBuilder.CreateBox('gateFront', gateOptions, scene);
	gateFront.position = new Vector3(end.center.x, end.center.y + .5 - 1, end.center.z);
	gateFront.physicsImpostor = new PhysicsImpostor(gateFront, PhysicsImpostor.BoxImpostor, { friction: 50, mass: 0, restitution: 0 });

	const gateBack = MeshBuilder.CreateBox('gateBack', gateOptions, scene);
	gateBack.position = new Vector3(
			end.center.x + (start.center.x - end.center.x) / 2,
			end.center.y + (start.center.y - end.center.y) / 2 + .5 - 1,
			end.center.z
	);
	gateBack.physicsImpostor = new PhysicsImpostor(gateBack, PhysicsImpostor.BoxImpostor, { friction: 50, mass: 0, restitution: 0 });

	return gate;
}

