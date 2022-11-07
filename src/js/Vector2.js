import is from './is.js'
import Vector from './Vector.js'
import trig from "./trig";

class Vector2 extends Vector {

	static #down = new Vector2(0, -1)
	static #left = new Vector2(-1, 0)
	static #right = new Vector2(1, 0)
	static #up = new Vector2(0, 1)
	static #zero = new Vector2(0, 0)

	// TODO: This should be private but 'is' throws an exception
	static coordinateNames = ['x', 'y'];

	constructor(x, y) {
		super(2);
		if (!is.defined(x)) {
		} else if (x instanceof Vector2) {
			for (let i = 0; i < 2; i++) this.coordinates[i] = x.coordinates[i];
		} else {
			if (Vector.is(x, Vector2.coordinateNames)) {
				this.coordinates[0] = x.x;
				this.coordinates[1] = x.y;
			} else {
				this.coordinates[0] = x;
				this.coordinates[1] = y;
			}
		}
	}

	get x() { return this.coordinates[0] }
	get y() { return this.coordinates[1] }

	static get down() { return Vector3.#down }
	static get left() { return Vector3.#left }
	static get right() { return Vector3.#right }
	static get up() { return Vector3.#up }
	static get zero() { return Vector3.#zero }

	static is(value) {
		return value instanceof Vector2 || Vector.is(value, Vector2.coordinateNames);
	}
	static validate(object, memberName, objectName) {
		const value = object[memberName];
		if (Vector2.is(value)) return new Vector2(value);
		throw new TypeError(`${objectName}.${memberName} must be a 2D vector`);
	}

	newHack() { return new Vector2() }
}

export default Vector2