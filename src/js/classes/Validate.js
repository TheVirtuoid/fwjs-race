import Vector from "./Vector";

export default class Validate {
	constructor() {
		throw new Error('Validate is a static class. You cannot instantiate it.');
	}

	static checkForNumber(name, value) {
		if (isNaN(value)) {
			throw new TypeError(`${name} must be a number`);
		}
	}

	static  checkForPositiveNumber(name, value) {
		Validate.checkForNumber(name, value);
		if (value <= 0) {
			throw new RangeError(`${name} must be a positive number`);
		}
	}

	static checkForVector(name, value) {
		if (!(value instanceof Vector)) {
			throw new TypeError(`${name} must be a vector`);
		}
		if (typeof value === 'object') {
			Validate.checkForNumber(name + '.x', value.x);
			Validate.checkForNumber(name + '.y', value.y);
			Validate.checkForNumber(name + '.z', value.z);
		} else {
			throw new TypeError(`${name} must be a vector`);
		}
	}
}