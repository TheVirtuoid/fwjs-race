import StaticClassError from '../../js/errors/StaticClassError.js'
import Vector3 from './Vector3.js'

class bezier {

	constructor() {
		throw new StaticClassError('bezier')
	}

	static build(trackSegment, sp0, sp1, vectorFactory, precision) {

		// Compute the Bezier cubic curve points
		const curve = {
			points: [],
			medianWidths: [ sp0.medianWidth, sp1.medianWidth ],
			trackBanks: [ bezier.getDown(sp0), bezier.getDown(sp1) ],
			trackWidths: [ sp0.trackWidth, sp1.trackWidth ],
			wallHeights: [ sp0.wallHeight, sp1.wallHeight ],
		}
		curve.points[0] = sp0.center;
		curve.points[1] = curve.points[0].add(sp0.forwardWeight, sp0.forward);
		curve.points[3] = sp1.center;
		curve.points[2] = curve.points[3].add(-sp1.backwardWeight, sp1.forward);

		// If either up vector is not Vector3.up, disable the alternate down hack
		if (Vector3.up.dot(sp0.up) !== 1 || Vector3.up.dot(sp1.up) !== 1) {
			curve.useAlt = false;
		}

		// Fill out the curve
		const bpt0 = bezier.#getPoint(curve, 0);
		const bpt1 = bezier.#getPoint(curve, 1);
		bezier.#interpolate(trackSegment, curve, 0, 1, bpt0, bpt1, vectorFactory, precision);

		// Return the last point
		return bpt1;
	}

	static getDown(sp) {

		// Compute the true 'down' vector. This must be orthogonal to the forward vector.
		// Remove any component of the down vector inline with the forward vector.
		let down = sp.up.scale(-1);
		const dot = sp.forward.dot(down);
		if (Math.abs(dot) > .0001)  {
			down = down.add(-dot, sp.forward);
		}

		// Rotate the down vector if there is banking
		if (Math.abs(sp.trackBank) > .0001) {
			down = down.rotate(sp.forward, sp.trackBank);
		}

		return down.normalize();
	}

	static #getPoint(curve, t) {
		const olt = 1 - t;	// one less t

		// Compute the point at t
		// v(t) = (1-t)^3*p0 + 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3*p3
		const vScalars = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
		const center = Vector3.scaledSum(curve.points, vScalars);

		// TODO: Need to verify; see analysis of source material in spiralParser
		// Compute the forward vector with is the tangent at t
		// v'(t) = 3*(1-t)^2*(p1 - p0) + 6*(1-t)*t*(p2-p1) + 3*t^2*(p3-p2).
		// Note that we normalize this to get a unit vector.
		const dvScalars = [3 * olt * olt, 6 * olt * t, 3 * t * t];
		const dvPoints = [
			curve.points[1].add(-1, curve.points[0]),
			curve.points[2].add(-1, curve.points[1]),
			curve.points[3].add(-1, curve.points[2]),
		];
		const forward = Vector3.scaledSum(dvPoints, dvScalars).normalize();

		// Compute the track width and wall height through linear interpolation
		const trackWidth = olt * curve.trackWidths[0] + t * curve.trackWidths[1];
		const wallHeight = olt * curve.wallHeights[0] + t * curve.wallHeights[1];
		const medianWidth = olt * curve.medianWidths[0] + t * curve.medianWidths[1];

		// Interpolate the down vector
		const down = bezier.#interpolateDownHack(curve, forward, t);

		return { center, down, forward, medianWidth, trackWidth, wallHeight };
	}

	// Generate the Bezier cubic curve between t0 and t1
	static #interpolate(trackSegment, curve, t0, t1, bpt0, bpt1, vectorFactory, precision) {

		// NOTE: A cubic Bezier curve generates points, or slices in our case,
		// p0, ..., pn where p0 is the point at t0 and pn is the point at t1.
		// However, for consecutive curves c and d, the last point of c is the
		// same as the first point of d. To avoid duplication of points in the
		// track segment, this routine only adds points p0, ..., pn-1. Note that
		// same holds for contiguous sections of a curve.

		// Calculate the linear and curve midpoints of the current subsection
		const midtime = (t0 + t1) / 2;
		const lmp = bpt0.center.midpoint(bpt1.center);	// Linear midpoint
		const bmp = bezier.#getPoint(curve, midtime);	// Bezier midpoint
		const d0m = bpt0.center.toNormal(lmp);
		const dm1 = lmp.toNormal(bpt1.center);
		const dPrecision = 1 - precision;

		// If the linear midpoint is close enough to the curve midpoint and its forward
		// direction is close enough to the endpoints, add bmp0 to the  track segment.
		// Otherwise recursively add the sections of the curve
		// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
		// the midpoint calcuated here.
		const closeEnough = lmp.distance(bmp.center) <= precision &&
			bpt0.forward.dot(d0m) >= dPrecision &&
			 dm1.dot(bpt1.forward) >= dPrecision;
		if (closeEnough) {
			trackSegment.push(bpt0, vectorFactory);
		} else {
			bezier.#interpolate(trackSegment, curve, t0, midtime, bpt0, bmp, vectorFactory, precision);
			bezier.#interpolate(trackSegment, curve, midtime, t1, bmp, bpt1, vectorFactory, precision);
		}
	}

	static #interpolateDownHack(curve, forward, t) {

		if (curve.useAlt === undefined && Math.abs(Vector3.up.dot(forward)) > .9) {
			curve.useAlt = true;
		}

		if (!curve.useAlt) {
			return curve.trackBanks[0].interpolate(curve.trackBanks[1], t).normalize();
		} else {
			const epForward = (t > .5 ?
				curve.points[1].add(-1, curve.points[0]) :
				curve.points[3].add(-1, curve.points[2]));
			const axis = epForward.cross(forward).normalize();
			return axis.rotate(forward, -90);
		}
	}
}

export default bezier