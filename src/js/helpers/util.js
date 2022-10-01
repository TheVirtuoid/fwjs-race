import {validatePositiveNumber, validateTrackBank} from "./validators";
import {isDefined, isFunction, isObject, isString} from "./typeCheck";

/*

 NOTES

 (1)	Any function that takes a 'name' argument treats 'name' as either a
		function that returns a string or a string. This allows late creation
		of strings, mainly for the occasional exception. The function
		'resolveName' handles this resolution of the name.
 (2)	In cases where a string-only name is needed, the argument name is
		'nameStr'.

 */

export const validSettings = [
	{ key: 'precision', validator: validatePositiveNumber },
	{ key: 'trackBank', validator: validateTrackBank, },
	{ key: 'trackWidth', validator: validatePositiveNumber },
	{ key: 'wallHeight', validator: validatePositiveNumber },
];

export function combineNames(prefix, nameStr) {
	return prefix.length === 0 ? nameStr : (prefix + '.' + nameStr);
}

export function jsonOrObject(o, name) {
	if (isString(o)) return JSON.parse(o);
	if (isObject(o)) return o;
	throw new TypeError(`${resolveName(name)} must be an JSON string or object`);
}

export function mergeSettings(masterSettings, overrideSettings, name) {
	const mergedSettings = {...masterSettings};
	for (let vs of validSettings) {
		const value = overrideSettings[vs.key];
		if (isDefined(value)) {
			mergedSettings[vs.key] = vs.validator(value, () => { return combineNames(resolveName(name), vs.key); });
		}
	}
	return mergedSettings;
}

export function resolveName(name) {
	return isFunction(name) ? name() : name;
}