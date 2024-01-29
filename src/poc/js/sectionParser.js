import pointParser from './pointParser.js'
import spiralParser from './spiralParser.js'
import straightParser from './straightParser.js'

import is from './is.js'
import StaticClassError from '../../js/errors/StaticClassError.js'
import validate from './validate.js'

class sectionParser {

	constructor() { throw new StaticClassError('sectionParser') }

	static parse(builders, points, rawPoint, parentSettings, name) {

		// The raw point must be an object
		validate.object(rawPoint, name);

		// Check the type
		const selectedType = is.defined(rawPoint.type) ? rawPoint.type : 'point';
		const selectedParser = this.#parsers[selectedType];
		if (!is.defined(selectedParser)) {
			throw new TypeError(`${name}.type of '${selectedType}' is not recognized`);
		}

		// Parse the section
		selectedParser.parse(builders, points, rawPoint, parentSettings, name);
	}

	static #parsers = {
		point: pointParser,
		spiral: spiralParser,
		straight: straightParser,
	}
}

export default sectionParser
