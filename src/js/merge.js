import is from './is.js'
import StaticClassError from './errors/StaticClassError.js'
import validate from './validate.js'
import Vector3 from './Vector3.js'

class merge {

	constructor() {
		throw new StaticClassError('merge');
	}

	static default = {
		precision: .01,
		trackBank: 0,
		trackWidth: 1,
		wallHeight: .5,
	}

	static settings(parentSettings, overrideSettings, name) {
		const mergedSettings = {...parentSettings};
		for (let vs of this.#validSettings) {
			if (is.defined(overrideSettings[vs.key])) {
				mergedSettings[vs.key] = vs.validator ?
					vs.validator(overrideSettings, vs.key, name) :
					overrideSettings[vs.key];
			}
		}
		return mergedSettings;
	}

	static #validSettings = [
		{ key: 'debug' },
		{ key: 'debugSegments' },
		{ key: 'altDeclinationAlgo' },
		{ key: 'precision', validator: validate.positiveNumber },
		{ key: 'trackBank', validator: validate.trackBank, },
		{ key: 'trackWidth', validator: validate.positiveNumber },
		{ key: 'wallHeight', validator: validate.positiveNumber },
	]
}

export default merge