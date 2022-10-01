import {isArray, isDefault, isNumber, isObject, isPositiveNumber} from "./typeCheck";
import Vector from "../classes/Vector";
import {resolveName} from "./util";

export function validateObject(value, name) {
	if (isObject(value)) {
		return value;
	}
	throw new TypeError(`${resolveName(name)} must be an object`);
}

export function validatePositiveNumber(value, name) {
	if (isPositiveNumber(value)) {
		return value;
	}
	throw new RangeError(`${resolveName(name)} number be a positive number`);
}

export function validateSizedArray(value, minElements, name) {
	if (isArray(value)) {
		if (value.length >= minElements) {
			return value;
		}
		throw new RangeError(`${resolveName(name)} must have at least ${minElements} element(s)`);
	}
	throw new TypeError(`${resolveName(name)} must be an Array`);
}

export function validateTrackBank(value, name) {
	if (Vector.isVector3(value)) {
		return value;
	}
	if (isNumber(value)) {
		let v = value % 360;
		if (v > 180) v -= 360;
		if (v <= -180) v += 360;
		return v;
	}
	throw new TypeError(`${resolveName(name)} must be a number or 3D vector`);
}

export function validateVector3(value, name) {
	if (Vector.isVector3(value)) {
		return value;
	}
	throw new TypeError(`${resolveName(name)} must be a 3D vector`);
}

export function validateWeight(value, name) {
	if (isDefault(value)) {
		return 1;
	}
	if (isPositiveNumber(value)) {
		return value;
	}
	throw new RangeError(`${resolveName(name)} must be a positive number`);
}
