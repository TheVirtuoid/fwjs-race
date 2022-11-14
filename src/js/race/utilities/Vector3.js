import is from './is.js'
import Vector from './Vector.js'
import trig from "./trig";

class Vector3 extends Vector {

	static #backward = new Vector3(0, 0, -1)
	static #down = new Vector3(0, -1, 0)
	static #forward = new Vector3(0, 0, 1)
	static #left = new Vector3(-1, 0, 0)
	static #right = new Vector3(1, 0, 0)
	static #up = new Vector3(0, 1, 0)
	static #zero = new Vector3(0, 0, 0)

	// TODO: This should be private but 'is' throws an exception
	static coordinateNames = ['x', 'y', 'z'];

	constructor(x, y, z) {
		super(3);
		if (!is.defined(x)) {
		} else if (x instanceof Vector3) {
			for (let i = 0; i < 3; i++) this.coordinates[i] = x.coordinates[i];
		} else {
			if (Vector.is(x, Vector3.coordinateNames)) {
				this.coordinates[0] = x.x;
				this.coordinates[1] = x.y;
				this.coordinates[2] = x.z;
			} else {
				this.coordinates[0] = x;
				this.coordinates[1] = y;
				this.coordinates[2] = z;
			}
		}
	}

	get x() { return this.coordinates[0] }
	get y() { return this.coordinates[1] }
	get z() { return this.coordinates[2] }

	static get backward() { return Vector3.#backward }
	static get down() { return Vector3.#down }
	static get forward() { return Vector3.#forward }
	static get left() { return Vector3.#left }
	static get right() { return Vector3.#right }
	static get up() { return Vector3.#up }
	static get zero() { return Vector3.#zero }

	static is(value) {
		return value instanceof Vector3 || Vector.is(value, Vector3.coordinateNames);
	}
	static validate(object, memberName, objectName) {
		const value = object[memberName];
		if (Vector3.is(value)) return new Vector3(value);
		throw new TypeError(`${objectName}.${memberName} must be a 3D vector`);
	}

	cross(v) {
		return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
	}
	newHack() { return new Vector3() }
	rotate(axis, angle) {
		if (!(axis instanceof Vector3)) throw new Error('Vector3.rotate: axis is not a Vector3');
		if (!is.number(angle)) throw new Error('Vector3.rotate: angle is not a number');
		const theta = angle * trig.degreesToRadians;
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		return this.scale(cos).add(sin, axis.cross(this)).add(this.dot(axis) * (1 - cos), axis);
	}
}

export default Vector3