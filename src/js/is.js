import StaticClassError from './StaticClassError.js';

class is {

	constructor() {
		throw new StaticClassError('is');
	}

	static array(value) {
		return this.object(value) && this.instance(value, 'Array');
	}
	static boolean(value) {
		return typeof(value) === 'boolean';
	}
	static default(value) {
		return value === null || value === undefined;
	}
	static defined(value) {
		return value !== null && value !== undefined;
	}
	static function(value) {
		return typeof(value) === 'function';
	}
	static instance(value, className) {
		return value.constructor.toString().indexOf(className) > -1;
	}
	static integer(value) {
		return Number.isInteger(value);
	}
	static number(value) {
		return typeof(value) === 'number';
	}
	static object(value) {
		return typeof(value) === 'object';
	}
	static positiveNumber(value) {
		return this.number(value) && value > 0;
	}
	static string(value) {
		return typeof(value) === 'string';
	}
	static vector(value, coords) {
		if (!this.object(value)) return false;
		for (let coord of coords) {
			if (!this.number(value[coord])) return false;
		}
		return true;
	}
	static vector3(value) {
		return this.vector(value, is.#coords3);
	}

	static #coords3 = ['x', 'y', 'z'];
}

export default is;
