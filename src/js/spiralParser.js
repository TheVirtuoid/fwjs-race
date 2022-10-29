import { createBuilder } from './Builder.js'
import CylindricalCoordinate from './CylindricalCoordinate.js'
import is from './is.js'
import merge from './merge.js'
import NotImplementedError from './errors/NotImplementedError.js'
import Plane from './Plane.js'
import pointParser from './pointParser.js'
import StaticClassError from './errors/StaticClassError.js'
import trig from './trig.js'
import validate from './validate.js'
import Vector3 from './Vector3.js'

// TODO
// * Create a new class Helix and pass that around instead of a Plane. This
//		would allow for Plane to get rid of getHelixAt.

class spiralParser {

	constructor() {
		throw new StaticClassError('spiralParser')
	}

	/*--------------------------------------------------------------------------
	THEORETICAL FOUNDATION

	A spiral section represents a helix with varying radii. If the start and
	end of the helix are on the same level, the helix degenerates into a
	planar curve.

	A spiral section has (a) a center of the rotation, (b) a normalized
	rotation axis, (c) an entry point, (d) an exit point, and (e) a number of
	full rotations, or turns, between the entry and exit points.

	For now we ignore the direction of rotation, being either clockwise or
	counterclockwise.

	Let the rotation plane be the plane defined by the center and rotation
	axis with the plane's normal being the rotation axis. The plane also has
	an arbitrary polar axis analogous to the X coordinate axis in standard
	Euclidean geometry. The polar axis is orthogonal to the rotation axis.

	Hence, the rotation plane dictates the entry and exit points' cylindrical
	coordinates, being the points' radius, angle, and height. For convenience,
	the exit point's angle is increased or decreased by 360° times the number
	of turns.

	The spiral section then produces a curve, from the entry point to the
	exit point with intermediate points linearly interpolating between the
	points' cylindrical coordinates.

	--------------------------------------------------------------------------*/
	static parse(builders, points, rawSpiral, parentSettings, name) {
		const specs = this.#getSpecs(points, rawSpiral, parentSettings, name);
		this.#generate(builders, points, specs, rawSpiral, parentSettings, name);
	}

	static getDeclinationAlgorithms() {
		return [ 'getPointForward', 'arcollins' ]
	}

	static #circleWeight = 0.5519150244935105707435627;

	/*--------------------------------------------------------------------------
	SPECIFICATION

	For convenience, define a 'point-forward' to be an object with two members:
		'vector': object having 'x', 'y', and 'z' keys defining numeric
			coordinate values
		'point': a vector defining a point in space
		'direction': a vector defining a direction

	Using these, define:
		'center-forward': object with a 'center' point and 'forward' direction

	'center' (required if some situations, illegal in others)
		If specified, a point setting the center of rotation.
	'endsAt' (required)
		A center-forward defining the exit point and direction of the spiral
		at that point. A 'forwardWeight' is optional.
	'rotate' (required)
		This is either 'left', 'right', or 'up' and determines the rotation
		axis and how the spiral rotates relative to the entry point. The
		left and right rotations use an upward axis while up uses a rightward
		axis, relative to the entry point's forward direction.
	'startsAt' (required if the spiral starts the track segment)
		If specified, a center-forward definig the entry point of the spiral.
		This is illegal if the spiral does not start the segment. Any
		'forwardWeight' is ignored.
	'turns' (optional)
		A positive integer setting the number of complete rotations in the
		spiral. If not specified, this is treated as no complete rotations.

	--------------------------------------------------------------------------*/
	static #getSpecs(points, rawSpiral, parentSettings, name) {

		// Create the settings and base spiral specification
		const settings = merge.settings(parentSettings, rawSpiral, name);
		const specs = {};
		if (settings.debug) specs.debug = settings.debug;
		if (settings.debugSegments) specs.debugSegments = settings.debugSegments;

		// Get either the entry point or the overrideFirstWeight option
		if (points.length === 0) {
			specs.startsAt = pointParser.validate(rawSpiral.startsAt, settings, name + '.startsAt');
		} else {
			if (is.defined(rawSpiral.startsAt)) {
				throw new RangeError(`${name}.startsAt cannot be specified for a spiral that does not start a segment`);
			}
			specs.startsAt = points[points.length - 1];
		}

		// Get the number of turns
		const turns = validate.nonNegativeInteger(rawSpiral, 'turns', name, 0);

		// Get the rotation
		const rotate = validate.string(rawSpiral, 'rotate', name);
		if (rotate !== 'left' && rotate !== 'right' && rotate !== 'up') {
			throw new RangeError(`${name}.rotate must be either 'left', 'right', or 'up'.`);
		}
		specs.rotate = rotate;

		// Get the endsAt
		specs.endsAt = pointParser.validate(rawSpiral.endsAt, settings, name + '.endsAt');

		// Determine the rotation plane.
		specs.rotationPlane = this.#getRotationPlane(specs, rotate, rawSpiral, name);

		// Now that we have the rotation plane, we can compute the angles,
		// altitudes, and radii
		specs.entry = this.#getCylindricalCoordinate(specs, 'startsAt');
		specs.exit = this.#getCylindricalCoordinate(specs, 'endsAt');

		// Set the sweep
		const { sweep, endAngle } = this.#getSweep(specs, rotate, turns);
		if (endAngle !== specs.exit.angle) {
			specs.exit = new CylindricalCoordinate(specs.exit.radius, endAngle, specs.exit.height);
		}
		specs.sweep = sweep;
		if (is.number(settings.altDeclination)) specs.altDeclination = settings.altDeclination;
		else if (is.string(settings.altDeclination)) specs.altDeclination = Number(settings.altDeclination);
		specs.altDeclinationAlgo = is.string(settings.altDeclinationAlgo) ? settings.altDeclinationAlgo : 'getPointForward';

		// Set the trackBank multiplier
		specs.trackBank = settings.trackBank;
		if (rotate === 'left') specs.trackBankMultiplier = 1;
		else if (rotate === 'right') specs.trackBankMultiplier = -1;
		else throw new NotImplementedError('spiralParser.#getSpecs', `${rotate} trackBankMultiplier`);

		// Return the specifications
		return specs;
	}

	static #getCylindricalCoordinate(specs, memberName) {
		return specs.rotationPlane.getCylindricalCoordinate(specs[memberName].center)
	}

	static #getRotationAxis(specs, rotate) {
		// TODO: This assumes the rotation axis is either up or forward.
		// This may not always be the case.
		if (rotate === 'left' || rotate === 'right') return Vector3.up;
		throw new NotImplementedError('spiralParser.#getRotationAxis', rotate);
	}

	static #getRotationPlane(specs, rotate, rawSpiral, name) {

		// Get the entry and exit planes
		const entryPlane = new Plane(specs.startsAt.center, specs.startsAt.forward);
		const exitPlane = new Plane(specs.endsAt.center, specs.endsAt.forward);

		// From the condition of the entry and exit planes, plus any
		// supporting specifications, determine the rotation center and axis
		let rotCenter, rotAxis;
		if (entryPlane.isSame(exitPlane)) {
			if (is.defined(rawSpiral.center)) {
				if (rotate === 'left' || rotate === 'right') {
					// Center cannot be directly above/below the entry or exit point
					const center = Vector3.validate(rawSpiral, 'center', name);
					const isAboveBelow = function(plane, point) {
						const planeUp = Vector3.up.add(-Vector3.up.dot(plane.normal), plane.normal).normalize();
						const toPoint = plane.origin.toNormal(point);
						const d = planeUp.dot(toPoint);
						return Math.abs(d) > .95;
					}
					if (isAboveBelow(entryPlane, center)) {
						throw new Error(`${name}: center and entry points are too close vertically; center must have some offset`);
					}
					if (isAboveBelow(exitPlane, center)) {
						throw new Error(`${name}: center and exit points are too close vertically; center must have some offset`);
					}
					rotCenter = center;
					rotAxis = this.#getRotationAxis(specs, rotate);
				} else {
					throw new NotImplementedError('spiralParser.#getRotationPlane',  'center, rotate up identical entry and exit planes');
				}
			} else if (rotate === 'left' || rotate === 'right') {
				const toEnd = entryPlane.origin.toNormal(exitPlane.origin);
				const d = Vector3.up.dot(toEnd);
				if (Math.abs(d) >= .9) {
					throw new Error(`${name}: starting and ending points are too close vertically; center required`);
				}
				rotCenter = entryPlane.origin.midpoint(exitPlane.origin);
				rotAxis = this.#getRotationAxis(specs, rotate);
			} else {
				throw new NotImplementedError('spiralParser.#getRotationPlane', 'no center, rotate up identical entry and exit planes');
			}
		} else if (entryPlane.isParallel(exitPlane)) {
			//const center = Vector3.validate(rawSpiral, 'center', name);
			//if (rotate === 'left') {
			//} else if (rotate === 'right') {
			//} else {
			//}
			throw new NotImplementedError('spiralParser.#getRotationPlane', 'parallel entry and exit planes');
		} else {
			// 'center' is illegal
			validate.undefined(rawSpiral, 'center', name, 'entry and exit planes intersect');

			// Get intersection of the planes, a line, and use this as
			// the rotation center and axis
			const line = entryPlane.getIntersection(exitPlane, { clamp: true });
			rotCenter = line.origin;
			rotAxis = line.normal;
		}

		// Return the rotation plane
		return new Plane(rotCenter, rotAxis);
	}

	static #getSweep(specs, rotate, turns) {
		const turnsDegrees = turns * 360;
		const startAngle = specs.entry.angle;
		let sweep, endAngle = specs.exit.angle;
		if (rotate === 'left') {
			if (startAngle > endAngle) endAngle += 360;
			endAngle += turnsDegrees;
			sweep = endAngle - startAngle;
		} else if (rotate === 'right') {
			if (startAngle < endAngle) endAngle -= 360;
			endAngle -= turnsDegrees;
			sweep = startAngle - endAngle;
		} else {
			throw new Error('_setSweep: need to compute sweep up');
		}
		return {
			endAngle: endAngle,
			sweep: sweep,
		}
	}

	/*--------------------------------------------------------------------------
	IMPLEMENTATION

	The #getSpecs function compiles the user specification into an algorithm
	friendly specification. Hereout, the term specification refers to this
	algorithm friedly form.

	'sweep' is the difference between the entry and exit points' angles
	including 360° times the number of turns. This is always positive.

	As with all good parametric algorithms, the algorithm execute functions
	providing 0 <= t <= 1, representing an angle of the helix between 0 and
	sweep.

	Given t, we can now linearly interpolate between the cylindrical
	coordinates of the entry and exit points. Note that #getSpecs adjusts
	the angle of the exit point to reflect clockwise or counterwise rotation.

	Note that the Bezier algorithm requires the tangent or forward direction
	of these intermediate points.

	--------------------------------------------------------------------------*/
	static #generate(builders, points, specs, rawSpiral, parentSettings, name) {

		// Insert the entry point if this is the first point of the segment.
		// Otherwise patch its forwardWeight if required.
		if (points.length === 0) points.push(specs.startsAt);
		const p = points[points.length - 1];
		p.forwardWeight = specs.entry.radius * this.#circleWeight;
		p.trackBank = this.#processInterpolationArray(specs.trackBank, 0, specs.trackBankMultiplier);

		// Add the 90° points
		const parts = Math.ceil(specs.sweep / 90);
		for (let i = 1; i < parts; i++) {
			this.#addPoint(builders, points, i / parts, specs, rawSpiral, parentSettings, name);
		}

		// Add the last point
		specs.endsAt.backwardWeight = specs.exit.radius * this.#circleWeight;
		specs.endsAt.trackBank = this.#processInterpolationArray(specs.trackBank, 1, specs.trackBankMultiplier);
		points.push(specs.endsAt);
		builders.push(createBuilder(parentSettings));
	}

	static #addPoint(builders, points, t, specs, rawSpiral, parentSettings, name) {
		const cylPoint = specs.entry.interpolate(specs.exit, t);
		if (specs.debug) {
			console.log('spiralParser.#addPoint(%f): entry %o, exit %o, interpolated %o',
				t, specs.entry, specs.exit, cylPoint);
		}

		const options = {
			altDeclination: specs.altDeclination,
			debug: specs.debug,
			depth: specs.exit.height - specs.entry.height,
			getForward: this[specs.altDeclinationAlgo],
			radius: cylPoint.radius,
			rotate: specs.rotate,
			sweep: specs.sweep,
			theta: cylPoint.angle,
		};
		const helixPoint = specs.rotationPlane.getHelixAt(cylPoint, options);

		const pointName = `${name}@${cylPoint.angle}`;
		const point = merge.settings(parentSettings, rawSpiral, pointName);
		point.backwardWeight = cylPoint.radius * this.#circleWeight;
		point.center = helixPoint.point;
		point.forward = helixPoint.forward;
		point.forwardWeight = point.backwardWeight;
		point.name = pointName;
		point.trackBank = this.#processInterpolationArray(specs.trackBank, t, specs.trackBankMultiplier);

		points.push(point);
		builders.push(createBuilder(parentSettings));
	}

	static getPointForward(plane, cos, sin, radial, options) {
		/*
		Let a left-rotating helix be centered at (0, 0, 0), with radius r,
		starting at angle θ0 and altitude h0 and ending at angle θ1 and
		altitude h1. For our purposes, 0 ≤ θ0 < 2π and θ0 < θ1.

		The first point in the helix is (r cos θ0, h0, r sin θ0) and the
		last is (r cos θ1, h1, r sin θ1). Any point on the helix is provided by:
			P(θ) = (r cos θ, h0 + (h1 - h0) (θ - θ0) / (θ1 - θ0), r sin θ)
		where θ0 ≤ θ ≤ θ1.

		To verify, P(θ0)
			= (r cos θ0, h0 + (h1 - h0) (θ0 - θ0) / (θ1 - θ0), r sin θ0)
			= (r cos θ0, h0 + (h1 - h0) 0 / (θ1 - θ0), r sin θ0)
			= (r cos θ0, h0, r sin θ0)
		and P(θ1)
			= (r cos θ1, h0 + (h1 - h0) ( θ1 - θ0) / (θ1 - θ0), r sin θ1)
			= (r cos θ1, h0 + (h1 - h0) 1, r sin θ1)
			= (r cos θ1, h0 + h1 - h0, r sin θ1)
			= (r cos θ1, h1, r sin θ1)

		The tangent at an angle is then P’(θ)
			= (d[r cos θ]/dθ, d[h0 + (h1 - h0) (θ - θ0) / (θ1 - θ0)]/dθ, d[r sin θ]/dθ)
			= (-r sin θ, dh0/dθ + d[(h1 - h0) θ / (θ1 - θ0)]/dθ - d[(h1 - h0) (-θ0) / (θ1 - θ0)]/dθ, r cos θ)
			= (-r sin θ, (h1 - h0) / (θ1 - θ0), r cos θ)
		*/

		if (!is.defined(options.depth)) throw new Error();
		if (!is.defined(options.rotate)) throw new Error();
		if (!is.defined(options.sweep)) throw new Error();
		if (options.debug) {
			console.log('spiralParser.getPointForward: options %o', options);
		}

		if (options.rotate !== 'left' && options.rotate !== 'right') {
			throw new NotImplementedError('spiralParser.getPointForward',  options.rotate);
		}

		let height;
		if (Math.abs(options.depth) <= 0.1) height = 0;
		else {
			// TODO: The forward vector is not yet correct.
			//	'appearsToWork' seems to work for turns >= 4 but fails for turns <= 1
			//	'fromDerivative' seems to work for sweeps < 2π but fails otherwise
			const appearsToWork = 1 / options.depth;
			const fromDerivative = options.depth / (options.sweep * trig.degreesToRadians);
			height =
				is.defined(options.altDeclination) ? options.altDeclination :
				options.sweep <= 360 ? fromDerivative : appearsToWork;
			if (options.debug) {
				console.log('\tappearsToWork %f, fromDerivative %f, using %f',
					appearsToWork, fromDerivative, height);
			}
		}

		const k =
			options.rotate === 'left' ? 1 :
			options.rotate === 'right' ? -1 :
			0;

		const forward = plane.getPointAt(-k * sin, height, k * cos).normalize().clamp();
		if (options.debug) console.log('\tforward %o', forward);
		return forward;
	}

	static arcollins(plane, cos, sin, radial, options) {
		/*
		Code derived from https://2015fallhw.github.io/arcidau/HelixDrawing.html
		Author: A R Collins
		Other references from article:
			A. Riškus, "Approximation of a Cubic Bézier Curve by Circular Arcs and Vice Versa",
				Information Technology and Control, 2006
			Wikipedia article, Bézier spline
			I. Juhász, "Approximating the helix with rational cubic Bézier curves",
				Computer-Aided Design, 1995.
		*/

		//----------------------------------------------------------------------
		// Start A R Collins code
		const createHelicalArc = function(r, pitch, incAngle)
		{
			// References:
			// 1. A. Riskus, "Approximation of a Cubic Bezier Curve by Circular Arcs and Vice Versa"
			// 2. Imre Juhasz, "Approximating the helix with rational cubic Bezier curves"

			var alpha = incAngle*Math.PI/360.0,  // half included angle
			p = pitch/(2*Math.PI),    // helix height per radian
			ax = r*Math.cos(alpha),
			ay = r*Math.sin(alpha),
			b = p*alpha*(r - ax)*(3*r - ax)/(ay*(4*r - ax)*Math.tan(alpha)),
			b0 = {x:ax, y:-ay, z:-alpha*p},
			b1 = {x:(4*r - ax)/3, y:-(r - ax)*(3*r - ax)/(3*ay), z:-b},
			b2 = {x:(4*r - ax)/3, y:(r - ax)*(3*r - ax)/(3*ay), z:b},
			b3 = {x:ax, y:ay, z:alpha*p};

			return ["M", b0.x,b0.y,b0.z, "C", b1.x,b1.y,b1.z, b2.x,b2.y,b2.z, b3.x,b3.y,b3.z];
		}

		const createHelix = function(r, pitch, turns)
		{
			var incAngle, arcsPerTurn, nArcs,
				seg, i,
				s, c1, c2, e,
				arcData, arc, helix,
				alpha, theta, dz;

			function XYrotate(v, degs)
			{
				// rotate a 3D vector around the Z axis
				var A = Math.PI*degs/180.0,   // radians
				sinA = Math.sin(A),
				cosA = Math.cos(A);

				return {x: v.x*cosA - v.y*sinA, y: v.x*sinA + v.y*cosA, z:v.z};
			}

			function Ztranslate(v, d)
			{
				// translate a 3D vector along z axis
				return {x:v.x , y:v.y , z:v.z+d};
			}

			// find integer number of segments needed with 90<incAngle<120 deg
			nArcs = turns < 1? Math.ceil(3*turns): Math.floor(4*turns);
			arcsPerTurn = nArcs/turns;
			incAngle = 360/arcsPerTurn;

			arcData = createHelicalArc(r, pitch, incAngle);
			alpha = incAngle/2;
			dz = pitch/(2*arcsPerTurn);
			// rotate to 1st quadrant and translate to start in XY plane
			s = {x:arcData[1], y:arcData[2], z:arcData[3]};
			s = XYrotate(s, alpha);
			s = Ztranslate(s, dz);
			c1 = {x:arcData[5], y:arcData[6], z:arcData[7]};
			c1 = XYrotate(c1, alpha);
			c1 = Ztranslate(c1, dz);
			c2 = {x:arcData[8], y:arcData[9], z:arcData[10]};
			c2 = XYrotate(c2, alpha);
			c2 = Ztranslate(c2, dz);
			e = {x:arcData[11], y:arcData[12], z:arcData[13]};
			e = XYrotate(e, alpha);
			e = Ztranslate(e, dz);

			arc = ["M", s.x,s.y,s.z, "C", c1.x,c1.y,c1.z, c2.x,c2.y,c2.z, e.x,e.y,e.z];

			// start helix data array with first segment
			helix = arc.slice(0);
			// copy, rotate and translate successive curve segments and append to helix array
			for (i = 1; i<nArcs; i++)
			{
				theta = incAngle*(i % arcsPerTurn);
				dz = i*pitch/arcsPerTurn;

				c1 = XYrotate({x:arc[5], y:arc[6], z:arc[7]}, theta);
				c1 = Ztranslate(c1, dz);
				c2 = XYrotate({x:arc[8], y:arc[9], z:arc[10]}, theta);
				c2 = Ztranslate(c2, dz);
				e = XYrotate({x:arc[11], y:arc[12], z:arc[13]}, theta);
				e = Ztranslate(e, dz);

				helix.push(c1.x,c1.y,c1.z, c2.x,c2.y,c2.z, e.x,e.y,e.z);
			}

			return helix;
		}
		// End A R Collins code
		//----------------------------------------------------------------------

		/*----------------------------------------------------------------------
		OBSERVATIONS

		The return value, helix, differs from how this application treats
		Bezier curves. Here, helix consists of the letter "M", three numbers
		representing the 3D coordinates of the first point, a "C", and a
		series of numbers, the count of which is divisible by 9. Each group
		of three numbers represents a 3D coordinate of a control point and
		each group of three control points represent a section of the cubic
		Bezier curve.

		For convenience, imagine a modified helix array by removing the "M"
		and "C" elements and converting each triplet of numbers into 3D points.

		The curve passes through the first (index 0), fourth, and every third
		point afterwards. The points on either side of these pass-through
		points determine the tangent of the curve at the pass-through point.
		By construction, each pass-through point and its adjacent points are
		colinear though this is not generally true for all cubic Bezier
		curves.

		For this application, we treat each helix pass-through point as the
		center value of a segment point. Let h[k] denote such a pass-through
		point. If k-1 > 0, then the segment point's backwardWeight is the
		length of the vector h[k-1] - h[k]. If k+1 < h.length, then the
		segment point's forward vector is the normalized vector h[k+1] - h[k]
		and the forwardWeight is the length of h[k+1] - h[k].

		Note that since the application allows the user to specify the forward
		vectors of the first and last segment points, the constructed curve is
		not necessarily a true helix at these points.

		The createHelix function takes a radius (r), pitch, and turns of the
		helix. It calcuates the incAngle determined by turns. The function
		createHelicalArc takes r, pitch, and incAngle to construct a helical
		arc between the angles -incAngle/2 and incAngle/2. The createHelix
		function constructs a new arc by rotation the createHelicalArc arc
		by incAngle/2 to start the arc at angle 0. The function then produces
		the helix by copying the angle 0 arc, rotating and changing its height,
		enough times to form the helix.

		IMPLEMENTATION

		The application supports increasing/decreasing radii helices so
		the createHelix function cannot be used as is. Instead, we use the
		function createHelicalArc instead. As done in createHelix, we
		rotate the arc and take the tangent.

		Note a flaw in earlier implementations was the assumption that the
		forward and backward weights were fixed for the entire helix. This
		is not true.
		*/

		if (!is.defined(options.radius)) throw new Error();
		if (!is.defined(options.theta)) throw new Error();
		if (!is.defined(options.depth)) throw new Error();
		if (!is.defined(options.sweep)) throw new Error();
		if (options.debug) {
			console.log('spiralParser.arcollins: options %o', options);
		}

		const pitch = options.depth * 360 / options.sweep;
		const arc = createHelicalArc(options.radius, pitch, 90);

		// TODO: The right rotation calcuation is off
		const XYrotate = function(v, degs)
		{
			// rotate a 3D vector around the Z axis
			var A = Math.PI*degs/180.0,   // radians
			sinA = Math.sin(A),
			cosA = Math.cos(A);

			return {x: v.x*cosA - v.y*sinA, y: v.x*sinA + v.y*cosA, z:v.z};
		}

		const alpha = options.theta + 45;
		let p0 = {x:arc[1], y:arc[2], z:arc[3]};
		p0 = XYrotate(p0, alpha);
		let p1 = {x:arc[5], y:arc[6], z:arc[7]};
		p1 = XYrotate(p1, alpha);

		// TODO: Need to patch in weight; #circleWeight * radius is close
		// but not what this algorithm calculates
		const v01 = new Vector3(p1.x - p0.x, p1.z - p0.z, p1.y - p0.y);
		const weight = v01.length();
		let forward = v01.normalize().clamp();
		if (options.rotate === 'right') forward = forward.scale(-1);
		if (options.debug) console.log('\tforward %o', forward);
		return forward;
	}

	static #processInterpolationArray(value, t, multiplier) {
		if (Vector3.is(value)) return value;
		if (is.number(value)) return multiplier * value;
		if (t <= 0) return multiplier * value[0].v;
		if (t >= 1) return multiplier * value[value.length - 1].v;
		for (let i = 1; i < value.length; i++) {
			if (t >= value[i-1].t && t <= value[i].t) {
				return multiplier * (value[i-1].v * (1 - t) + value[i].v * t);
			}
		}
		throw new Error('#processInterpolationArray: Something went wrong');
	}
}

export default spiralParser