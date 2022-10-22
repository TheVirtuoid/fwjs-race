import is from "./is.js"
import StaticClassError from './StaticClassError.js'
import Vector3 from './Vector3.js'

class validate {

	constructor() {
		throw new StaticClassError('validate')
	}

	static boolean(object, memberName, objectName, defaultValue) {
		const value = object[memberName];
		if (is.default(value)) return defaultValue;
		if (is.boolean(value)) return value;
		throw new TypeError(`${objectName}.${memberName} must be 'true' or 'false'`);
	}

	static nonNegativeInteger(object, memberName, objectName, defaultValue) {
		const value = object[memberName];
		if (is.default(value)) return defaultValue;
		if (is.integer(value) && value >= 0) return value;
		throw new RangeError(`${objectName}.${memberName} number be a non-negative integer`);
	}

	static jsonOrObject(o, name) {
		if (is.string(o)) return JSON.parse(o);
		if (is.object(o)) return o;
		throw new TypeError(`${name} must be an JSON string or object`);
	}

	static object(object, objectName) {
		if (is.object(object)) return object;
		throw new TypeError(`${objectName} must be an object`);
	}

	static positiveNumber(object, memberName, objectName) {
		const value = object[memberName];
		if (is.positiveNumber(value)) return value;
		throw new RangeError(`${objectName}.${memberName} number be a positive number`);
	}

	static sizedArray(object, memberName, objectName, minElements) {
		const value = validate.#getValue(object, memberName);
		if (is.array(value)) {
			if (value.length >= minElements) return value;
			throw new RangeError(`${validate.#resolveName(objectName, memberName)} must have at least ${minElements} element(s)`);
		}
		throw new TypeError(`${validate.#resolveName(objectName, memberName)} must be an Array`);
	}

	static string(object, memberName, objectName) {
		const value = object[memberName];
		if (is.string(value)) return value;
		throw new TypeError(`${objectName}.${memberName} must be a string`);
	}

	static trackBank(object, memberName, objectName) {
		const value = object[memberName];
		if (Vector3.is(value)) return value;
		if (is.number(value)) return trig.normalizeAngle(value);
		if (is.array(value)) return validate.#interpolationArray(object, memberName, objectName);
		throw new TypeError(`${objectName}.${memberName} must be a number, 3D vector, or interpolation array`);
	}

	static undefined(object, memberName, objectName, reason) {
		if (is.defined(object[memberName])) {
			throw new TypeError(`Cannot specify ${objectName}.${memberName} because ${reason}.`);
		}
	}

	static weight(object, memberName, objectName) {
		const value = object[memberName];
		if (is.default(value)) return 1;
		if (is.positiveNumber(value)) return value;
		throw new RangeError(`${objectName}.${memberName} must be a positive number`);
	}

	static #getValue(object, memberName) {
		return memberName.length === 0 ? object : object[memberName];
	}

	static #interpolationArray(object, memberName, objectName) {
		const value = object[memberName];
		const name = objectName + '.' + memberName;
		if (!is.array(value) || value.length < 2) {
			throw new RangeError(name + ' must be an array with at least 2 elements');
		}
		const result = [];
		let lastT;
		for (let i = 0; i < value.length; i++) {
			const tvPair = value[i];
			if (!is.object(tvPair) || !is.number(tvPair.t) || !is.number(tvPair.v)) {
				throw new RangeError(`${name}[${i}] must be an object with 't' and 'v' number members`);
			}
			const t = tvPair.t;
			if (i === 0) {
				if (t !== 0) {
					throw new RangeError(name + '[0].t must be 0');
				}
			} else if (lastT >= t) {
				throw new RangeError(`${name}[${i-1}].t (${lastT})must be less than ${name}[${i}].t (${t})`);
			} else if (t > 1) {
				throw new RangeError(`${name}[${i}].t cannot be greater than 1`);
			}
			lastT = t;
			result.push({...tvPair});
		}
		if (lastT !== 1) {
			throw new RangeError(`${name}[${value.length - 1}].t must be 1`);
		}
		return result;
	}

	static #resolveName(objectName, memberName) {
		return memberName.length === 0 ? objectName : (objectName + '.' + memberName);
	}
}

export default validate;