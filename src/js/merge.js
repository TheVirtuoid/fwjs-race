import is from './is.js'
import StaticClassError from './errors/StaticClassError.js'
import validate from './validate.js'
import Vector3 from './Vector3.js'

class merge {

	constructor() {
		throw new StaticClassError('merge');
	}

	static default = {
		lanes: 1,
		medianWidth: .01,
		precision: .01,
		trackBank: 0,
		trackWidth: 1,
		up: Vector3.up,
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
		this.#postValidate(mergedSettings, name);
		return mergedSettings;
	}

	static #validSettings = [
		{ key: 'debug' },
		{ key: 'debugSegments' },
		{ key: 'lanes', validator: validate.positiveInteger },
		{ key: 'medianWidth', validator: validate.positiveNumber },
		{ key: 'precision', validator: validate.positiveNumber },
		{ key: 'trackBank', validator: validate.trackBank, },
		{ key: 'trackWidth', validator: validate.positiveNumber },
		{ key: 'up', validator: Vector3.validateNormal },
		{ key: 'wallHeight', validator: validate.positiveNumber },
	]

	static #postValidate(settings, name) {
		if (settings.medianWidth >= settings.trackWidth) {
			const msg = `${name}: medianWidth (${settings.medianWidth} cannot exceed trackWidth ${settings.medianWidth}`
			throw new RangeError(msg);
		}
	}
}

export default merge