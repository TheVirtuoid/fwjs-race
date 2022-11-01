import { createBuilder } from './Builder.js'
import is from './is.js'
import merge from './merge.js'
import StaticClassError from './errors/StaticClassError.js'
import validate from './validate.js'
import Vector3 from './Vector3.js'

class pointParser {

	constructor() {
		throw new StaticClassError('pointParser');
	}

	static parse(builders, points, rawPoint, parentSettings, name) {
		points.push(this.validate(rawPoint, parentSettings, name));
		if (points.length > 1) builders.push(createBuilder(parentSettings));
	}

	static validate(rawPoint, parentSettings, name) {

		// The raw point cannot have a 'precision' element
		if (is.defined(rawPoint.precision)) {
			throw new TypeError(`${name} cannot define precision`);
		}

		// Create the point with its settings and name
		const point = merge.settings(parentSettings, rawPoint, name);
		point.name = name;

		// The raw point must have a center object with x, y, and z numeric
		// elements
		point.center = Vector3.validate(rawPoint, 'center', name);

		// The point must have a forward vector
		point.forward = Vector3.validate(rawPoint, 'forward', name).normalize();

		// Get the weights
		point.forwardWeight = validate.weight(rawPoint, 'forwardWeight', name);
		point.backwardWeight = validate.weight(rawPoint, 'backwardWeight', name);

		return point;
	}
}

export default pointParser
