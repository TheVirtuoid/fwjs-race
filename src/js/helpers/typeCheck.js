export function isArray(value) {
	return isObject(value) && isInstance(value, 'Array');
}

export function isDefault(value) {
	return value === null || value === undefined;
}

export function isDefined(value) {
	return value !== null && value !== undefined;
}

export function isFunction(value) {
	return typeof(value) === 'function';
}

export function isInstance(value, className) {
	return value.constructor.toString().indexOf(className) > -1;
}

export function isNumber(value) {
	return typeof(value) === 'number';
}

export function isObject(value) {
	return typeof(value) === 'object';
}

export function isPositiveNumber(value) {
	return isNumber(value) && value > 0;
}

export function isString(value) {
	return typeof(value) === 'string';
}
