import Straight from "./Straight";

export default (args) => {
	const { slope, startingPosition, cars } = args;

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

	const gate = {};
	gate.track = new Straight({ start, end, forwardWeight: 1.1 });

	return gate;
}

