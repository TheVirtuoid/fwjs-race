import Vector from "./Vector";
import Ribbon from "./Ribbon";

export default class Bezier {

	static buildCurve (ribbon, sp0, sp1, vectorFactory, precision) {

		// Compute the Bezier cubic curve points
		const curve = {
			points: [
				sp0.center,
				Vector.add(sp0.center, sp0.forwardWeight, sp0.forward),
				Vector.add(sp1.center, -sp1.backwardWeight, sp1.forward),
				sp1.center,
			],
			trackBanks: [Bezier.getSegmentPointDownVector(sp0), Bezier.getSegmentPointDownVector(sp1)],
			trackWidths: [sp0.trackWidth, sp1.trackWidth],
			wallHeights: [sp0.wallHeight, sp1.wallHeight],
		}

		// Fill out the curve
		const bpt0 = Bezier.getBezierPoint(curve, 0);
		const bpt1 = Bezier.getBezierPoint(curve, 1);
		Bezier.interpolateCurve(ribbon, curve, 0, 1, bpt0, bpt1, vectorFactory, precision);

		// Return the points array
		return bpt1;
	}

	static getBezierPoint (curve, t) {
		const olt = 1 - t;	// one less t

		// Compute the point at t
		// v(t) = (1-t)^3*p0 + 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3*p3
		let coefficients = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
		const center = Vector.sum(coefficients, curve.points);

		// Compute the forward vector with is the tangent at t
		// v'(t) = 3*(1-t)^2*(p1 - p0) + 6*(1-t)*t*(p2-p1) + 3*t^2*(p3-p2).
		// Note that we normalize this to get a unit vector.
		coefficients = [3 * olt *olt, 6 * olt * t, 3 * t * t];
		const deltaPoints = [
			Vector.add(curve.points[1], -1, curve.points[0]),
			Vector.add(curve.points[2], -1, curve.points[1]),
			Vector.add(curve.points[3], -1, curve.points[2]),
		];
		const forward = Vector.normalize(Vector.sum(coefficients, deltaPoints));

		// Compute the track width and wall height through linear interpolation
		const trackWidth = olt * curve.trackWidths[0] + t * curve.trackWidths[1];
		const wallHeight = olt * curve.wallHeights[0] + t * curve.wallHeights[1];

		// Interpolate the down vector
		const down = Vector.normalize(Vector.interpolate(curve.trackBanks[0], curve.trackBanks[1], t));

		return {
			center: center,				// center line position at t
			down: down,					// Down vector at t
			forward: forward,			// Forward vector at t
			trackWidth: trackWidth,
			wallHeight: wallHeight,
		};
	}

	static getSegmentPointDownVector(sp) {

		// We are done if we already have a vector
		if (Vector.isVector3(sp.trackBank)) return sp.trackBank;

		// Compute the true 'down' vector. This must be orthogonal to the forward vector.
		// Remove any component of the down vector inline with the forward vector.
		let down = Vector.down;
		const dot = Vector.dot(sp.forward, down);
		if (Math.abs(dot) > .0001)  {
			down = Vector.normalize(Vector.add(down, -dot, sp.forward));
		}

		// Rotate the down vector if there is banking
		if (Math.abs(sp.trackBank) > .0001) {
			down = Vector.rotate(sp.forward, down, sp.trackBank);
		}

		return Vector.normalize(down);
	}

	// Generate the Bezier cubic curve between t0 and t1
	static interpolateCurve (ribbon, curve, t0, t1, bpt0, bpt1, vectorFactory, precision) {

		// NOTE: A cubic Bezier curve generates points, or slices in our case,
		// p0, ..., pn where p0 is the point at t0 and pn is the point at t1.
		// However, for consecutive curves c and d, the last point of c is the
		// same as the first point of d. To avoid duplication of points in the
		// ribbon, this routine only adds points p0, ..., pn-1. Note that same
		// holds for contiguous sections of a curve.

		// Calculate the linear and curve midpoints of the current subsection
		const midTime = (t0 + t1) / 2;
		const lmp = Vector.midpoint(bpt0.center, bpt1.center);	// Linear midpoint
		const bmp = Bezier.getBezierPoint(curve, midTime);				// Bezier midpoint

		// TODO: This precision test is insufficient. It is possible for the curve to pass
		// through the linear midpoint but the tangent at the midpoint be different (e.g.,
		// an 'S' curve passing through the midpoint).

		// If the linear midpoint is close enough to the curve midpoint, add bmp0
		// to the  ribbon. Otherwise recursively add the sections of the curve
		// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
		// the midpoint calcuated here.
		if (Vector.distance(lmp, bmp.center) <= precision) {
			Ribbon.addRibbonSlice(ribbon, bpt0, vectorFactory);
		} else {
			Bezier.interpolateCurve(ribbon, curve, t0, midTime, bpt0, bmp, vectorFactory, precision);
			Bezier.interpolateCurve(ribbon, curve, midTime, t1, bmp, bpt1, vectorFactory, precision);
		}
	}

};

