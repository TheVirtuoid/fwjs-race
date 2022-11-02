import Straight from "./Straight";
import {Color3, MeshBuilder, PhysicsImpostor, Vector3} from "@babylonjs/core";

export default (args) => {
	const { slope, startingPosition, cars, scene } = args;

	const rows = [];
	const gateWidth = .25;
	const spacing = .25;
	const riseRate = Math.tan(slope * Math.PI / 180);
	let maxCarLength = -1;
	let length = 0;
	cars.forEach((car, index) => {
		maxCarLength = Math.max(maxCarLength, car.length);
		if (!Number.isInteger(index / 2)) {
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
		cars.forEach((car, index) => {
			const rotate = slope;
			car.junk();
			let x, y, z;
			if (index <= 1) {
				x = end.center.x + car.length / 2;
				y = end.center.y + (car.length + gateWidth) * riseRate;
				z = index === 0 ? end.center.z - car.width : end.center.z + car.width;
			} else {
				x = end.center.x + car.length + gateWidth * 2 + spacing * 4;
				y = end.center.y + (car.length * 2 + gateWidth * 2) * riseRate;
				z = index === 2 ? end.center.z - car.width : end.center.z + car.width;
			}
			car.build({ rotate, position: new Vector3(x, y, z), scene });
		});

/*
		const car = cars[0];
		const rotate = slope;
		car.junk();
		car.build({
			rotate,
			position: new Vector3(
			end.center.x + car.length / 2,
				end.center.y + (car.length + gateWidth) * riseRate,
					end.center.z ), scene
		});
*/
	};

	const startRace = () => {
		gateBack.position.y -= 1;
		gateFront.position.y -= 1;
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

