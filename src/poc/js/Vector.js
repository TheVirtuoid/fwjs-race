import is from './is.js'

class Vector {

	coordinates;
	static #clampTolerance = .001;

	constructor(dimension) {
		this.coordinates = []
		if (is.integer(dimension)) {
			for (let i = 0; i < dimension; i++) this.coordinates[i] = 0;
		} else {
			for (let i = 0; i < dimension.length; i++) this.coordinates[i] = dimension[i];
		}
	}

	get dimension() { return this.coordinates.length }

	add(k, v) {
		return this.#makeVector((i) => this.coordinates[i] + k * v.coordinates[i])
	}
	clamp(tolerance) {
		if (!is.defined(tolerance)) tolerance = Vector.#clampTolerance;
		for (let i = 0; i < this.dimension; i++) {
			if (Math.abs(this.coordinates[i]) < tolerance) this.coordinates[i] = 0;
		}
		return this;
	}
	distance(v) { return this.to(v).length() }
	dot(v) {
		return this.#makeSum((i) => this.coordinates[i] * v.coordinates[i]);
	}
	interpolate(v, t) {
		const olt = 1 - t;
		return this.#makeVector((i) => olt * this.coordinates[i] + t * v.coordinates[i])
	}
	length() {
		return Math.sqrt(this.#makeSum((i) => this.coordinates[i] * this.coordinates[i]));
	}
	midpoint(v) {
		return this.#makeVector((i) => (this.coordinates[i] + v.coordinates[i]) / 2)
	}
	newHack() {
		throw new InternalError('Vector.newHack must be overridden')
	}
	normalize() {
		const length = this.length();
		return this.#makeVector((i) => this.coordinates[i] / length);
	}
	scale(k) {
		return this.#makeVector((i) => k * this.coordinates[i])
	}
	to(v) {
		return this.#makeVector((i) => v.coordinates[i] - this.coordinates[i])
	}
	toNormal(v) { return this.to(v).normalize() }

	static is(value, coordinateNames) {
		if (!is.object(value)) return false;
		for (let coord of coordinateNames) {
			if (!is.number(value[coord])) return false;
		}
		return true;
	}

	static scaledSum(vectors, scalars) {
		let sum = vectors[0].scale(scalars[0]);
		for (let i = 1; i < scalars.length; i++) {
			sum = sum.add(scalars[i], vectors[i]);
		}
		return sum;
	}

	#makeVector(f) {
		const result = this.newHack();
		for (let i = 0; i < result.dimension; i++) result.coordinates[i] = f(i);
		return result;
	}
	#makeSum(f) {
		let result = 0;
		for (let i = 0; i < this.dimension; i++) result += f(i);
		return result;
	}
}

export default Vector