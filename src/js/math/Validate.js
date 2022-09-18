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
		if (!value.x && !value.y && !value.z) {
			throw new TypeError(`${name} must be an object with x, y, and z properties.`);
		}
		Validate.checkForNumber(name + '.x', value.x);
		Validate.checkForNumber(name + '.y', value.y);
		Validate.checkForNumber(name + '.z', value.z);
	}
}