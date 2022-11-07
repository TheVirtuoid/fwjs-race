const helpers = {

	checkForCoincidentalPoints: function(points, numPoints, error, tolerance = 0.01) {
		const p = [];
		for (let i = 0; i < numPoints; i++) {
			p.push({
				x: Number(points['x' + i].value),
				y: Number(points['y' + i].value),
			});
		}

		for (let i = 0; i < numPoints - 1; i++) {
			for (let j = i + 1; j < numPoints; j++) {
				const dx = p[i].x - p[j].x;
				const dy = p[i].y - p[j].y;
				if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
					this.setError(error, `Points ${i} and ${j} are too close`);
					return true;
				}
			}
		}

		this.clearError(error);
		return false;
	},

	clearCanvas: function(canvas) {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		return ctx;
	},

	clearError: function(error) {
		error.classList.add("hidden");
	},

	initCanvas: function(owner) {
		const canvas = owner.querySelectorAll("canvas")[0];
		const size = Math.max(canvas.height, canvas.width);
		canvas.height = size;
		canvas.width = size;
		return canvas;
	},

	initCoordFields: function(owner, changeCallback) {
		const coords = owner.querySelectorAll(".coord");
		for (let coord of coords) {
			coord.max = 10;
			coord.min = -10;
			coord.step = 0.001;
			coord.maxLength = 7;
			if (changeCallback) coord.addEventListener("change", changeCallback);
		}
		return coords;
	},

	initError: function(owner) {
		const error = owner.querySelectorAll(".error")[0];
		error.classList.add("hidden");
		return error;
	},

	initPoints: function(coords) {
		const points = {};
		const prefixLength = coords[0].id.lastIndexOf('-') + 1;
		for (let coord of coords) {
			const suffix = coord.id.slice(prefixLength);
			points[suffix] = coord;
		}
		return points;
	},

	setError: function(error, msg) {
		error.classList.remove("hidden");
		error.querySelectorAll(".msg")[0].innerText = msg;
	}
}

export default helpers;