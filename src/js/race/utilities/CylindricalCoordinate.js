
class CylindricalCoordinate {

	#angle;
	#height;
	#radius;

	constructor(radius, angle, height) {
		this.#radius = radius;
		this.#angle = angle;
		this.#height = height;
	}

	get angle() { return this.#angle }
	get radius() { return this.#radius }
	get height() { return this.#height }

	interpolate(other, t) {
		const olt = 1 - t;
		return new CylindricalCoordinate(
			olt * this.#radius + t * other.#radius,
			olt * this.#angle + t * other.#angle,
			olt * this.#height + t * other.#height)
	}
}

export default CylindricalCoordinate