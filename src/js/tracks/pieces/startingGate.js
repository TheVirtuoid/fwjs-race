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

	start.forward = {
		x: end.center.x - start.center.x,
		y: end.center.y - start.center.y,
		z: end.center.z - start.center.z,
	};

	end.forward = start.forward;

	const straight = {
		type: 'straight',
		endsAt: end.center,
		startsAt: start.center,
		// forwardWeight: 1.1,
	}

	return { start, end, straight }
}

