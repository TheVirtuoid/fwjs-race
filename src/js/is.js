import StaticClassError from './StaticClassError.js';

class is {

	constructor() {
		throw new StaticClassError('is');
	}

	static array(value) {
		return value instanceof Array;
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
}

export default is;
