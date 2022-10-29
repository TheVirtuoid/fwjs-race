import CylindricalCoordinate from './CylindricalCoordinate.js'
import is from './is.js'
import Line from './Line.js'
import NotImplementedError from './errors/NotImplementedError.js'
import trig from './trig.js'
import Vector3 from './Vector3.js'

class Plane {

	static #defaultTolerance = 0.95;

	#normal;
	#origin;
	#xAxis;
	#yAxis;

	constructor(origin, normal) {
		this.#origin = origin;
		this.#normal = normal.normalize();
	}

	get normal() { return this.#normal }
	get origin() { return this.#origin }
	get xAxis() {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();
		return this.#xAxis
	}
	get yAxis() {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();
		return this.#yAxis
	}

	contains(vertex, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		return this.#getHeight(vertex) < (1 - tolerance);
	}
	getCylindricalCoordinate(vertex) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const toVertex = this.#toVertex(vertex);

		const x = this.#xAxis.dot(toVertex);
		const y = this.#yAxis.dot(toVertex);
		const angle = trig.clampDegrees(Math.atan2(y, x) * trig.radiansToDegrees);

		const height = this.#getHeightTo(toVertex);
		const radius = toVertex.add(-height, this.#normal).length();

		return new CylindricalCoordinate(radius, angle, height)
	}
	getIntersection(other, options) {

		// Get the line direction. Normalize should throw an error if the
		// planes are parallel
		if (!(other instanceof Plane)) throw new Error('Plane.getIntersection: other is not a Plane');
		const direction = this.#normal.cross(other.#normal).normalize();
		const clamp = options && options.clamp;
		if (clamp) direction.clamp();

		// TODO: Figure out why this works
		// see https://forum.unity.com/threads/how-to-find-line-of-intersecting-planes.109458/

		// Next is to calculate a point on the line to fix it's position.
		// This is done by finding a vector from the plane2 [other] location,
		// moving parallel to it's plane, and intersecting plane1. To
		// prevent rounding errors, this vector also has to be perpendicular
		// to lineDirection [ldir]. To get this vector, calculate the cross
		// product of the normal of plane2 [other] and the lineDirection [ldir].
		const ldir = other.#normal.cross(direction);

		const numerator = this.#normal.dot(ldir);

		// Prevent divide by zero.
		if (Math.abs(numerator) < .0001) {
			return new Line(Vector3.zero, direction);
		} else {
			const b2a = other.#origin.to(this.#origin);
			const t = this.#normal.dot(b2a) / numerator;
			const origin = other.#origin.add(t, ldir);
			return new Line(origin, direction);
		}
	}
	getPointAt(x, y, z) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();
		return Vector3.is(x) ?
			this.#xAxis.scale(x.x).add(x.y, this.#normal).add(x.z, this.#yAxis) :
			this.#xAxis.scale(x).add(y, this.#normal).add(z, this.#yAxis);
	}
	isParallel(other, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		const dot = this.#normal.dot(other.#normal);
		return Math.abs(dot) >= tolerance;
	}
	isSame(other, tolerance) {
		return this.isParallel(other, tolerance) && this.contains(other.#origin, tolerance);
	}
	setAxes(xAxis) {
		if (!(xAxis instanceof Vector3)) throw new Error('Plane.setAxes: xAxis is not a Vector3');
		this.#xAxis = xAxis.add(-xAxis.dot(this.#normal), this.#normal).normalize();
		this.#yAxis = this.#xAxis.cross(this.#normal);
	}

	#getHeight(vertex) {
		return this.#getHeightTo(this.#toVertex(vertex));
	}
	#getHeightTo(toVertex) {
		return this.#normal.dot(toVertex);
	}
	#setDefaultAxes() {
		if (Vector3.up.dot(this.#normal) > Plane.#defaultTolerance) {
			this.setAxes(Vector3.right);
		} else if (Vector3.down.dot(this.#normal) > Plane.#defaultTolerance) {
			this.#normal = this.#normal.scale(-1);
			this.setAxes(Vector3.right);
		} else {
			console.log('Plane.#setDefaultAxes: normal %o, dot up %f, dot down %f',
				this.#normal,
				Vector3.up.dot(this.#normal),
				Vector3.down.dot(this.#normal));
			throw new NotImplementedError('Plane.#setDefaultAxes');
		}
	}
	#toVertex(vertex) {
		return this.#origin.to(vertex);
	}
}

export default Plane