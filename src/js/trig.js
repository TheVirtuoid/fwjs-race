import is from './is.js'
import StaticClassError from './errors/StaticClassError.js'

class trig {

	constructor() {
		throw new StaticClassError('trig');
	}

	static oneZeroTolerance = .0001;
	static degreeTolerance = .1;

	static #degreesToRadians = Math.PI / 180;
	static #radiansToDegrees = 180 / Math.PI;

	static get degreesToRadians() { return trig.#degreesToRadians }
	static get radiansToDegrees() { return trig.#radiansToDegrees }

	static clampAt0And1(v, tolerance) {
		if (!is.defined(tolerance)) tolerance = trig.oneZeroTolerance;
		if (Math.abs(v) < tolerance) return 0;
		if (Math.abs(v - 1) < tolerance) return 1;
		if (Math.abs(v + 1) < tolerance) return -1;
		return v;
	}
	static clampDegrees(d, tolerance) {
		if (!is.defined(tolerance)) tolerance = trig.degreeTolerance;
		if (d < 0) d += 360;
		if (d < tolerance) return 0;
		if (Math.abs(d - 90) < tolerance) return 90;
		if (Math.abs(d - 180) < tolerance) return 180;
		if (Math.abs(d - 270) < tolerance) return 270;
		return d;
	}
	static normalizeAngle(angle) {
		let v = angle % 360;
		if (v > 180) v -= 360;
		if (v <= -180) v += 360;
		return v;
	}
}

export default trig