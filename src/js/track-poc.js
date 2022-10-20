
const is = {
	array: function(value) {
		return is.object(value) && is.instance(value, 'Array');
	},
	boolean: function(value) {
		return typeof(value) === 'boolean';
	},
	default: function(value) {
		return value === null || value === undefined;
	},
	defined: function(value) {
		return value !== null && value !== undefined;
	},
	function: function(value) {
		return typeof(value) === 'function';
	},
	instance: function(value, className) {
		return value.constructor.toString().indexOf(className) > -1;
	},
	integer: function(value) {
		return Number.isInteger(value);
	},
	number: function(value) {
		return typeof(value) === 'number';
	},
	object: function(value) {
		return typeof(value) === 'object';
	},
	positiveNumber: function(value) {
		return is.number(value) && value > 0;
	},
	string: function(value) {
		return typeof(value) === 'string';
	},
	vector: function(value, coords) {
		if (!is.object(value)) return false;
		for (let coord of coords) {
			if (!is.number(value[coord])) return false;
		}
		return true;
	},
	vector3: function(value) {
		return is.vector(value, this._coords3);
	},
	_coords3: ['x', 'y', 'z'],
}

const validate = {
	boolean: function(object, memberName, objectName, defaultValue) {
		const value = object[memberName];
		if (is.default(value)) return defaultValue;
		if (is.boolean(value)) return value;
		throw new TypeError(`${objectName}.${memberName} must be 'true' or 'false'`);
	},

	nonNegativeInteger: function(object, memberName, objectName, defaultValue) {
		const value = object[memberName];
		if (is.default(value)) return defaultValue;
		if (is.integer(value) && value >= 0) return value;
		throw new RangeError(`${objectName}.${memberName} number be a non-negative integer`);
	},

	jsonOrObject: function(o, name) {
		if (is.string(o)) return JSON.parse(o);
		if (is.object(o)) return o;
		throw new TypeError(`${name} must be an JSON string or object`);
	},

	object: function(object, objectName) {
		if (is.object(object)) return object;
		throw new TypeError(`${objectName} must be an object`);
	},

	positiveNumber: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.positiveNumber(value)) return value;
		throw new RangeError(`${objectName}.${memberName} number be a positive number`);
	},

	sizedArray: function(object, memberName, objectName, minElements) {
		const value = this._getValue(object, memberName);
		if (is.array(value)) {
			if (value.length >= minElements) return value;
			throw new RangeError(`${this._resolveName(objectName, memberName)} must have at least ${minElements} element(s)`);
		}
		throw new TypeError(`${this._resolveName(objectName, memberName)} must be an Array`);
	},

	string: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.string(value)) return value;
		throw new TypeError(`${objectName}.${memberName} must be a string`);
	},

	trackBank: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.vector3(value)) return value;
		if (is.number(value)) return trig.normalizeAngle(value);
		if (is.array(value)) return validate._interpolationArray(object, memberName, objectName);
		throw new TypeError(`${objectName}.${memberName} must be a number, 3D vector, or interpolation array`);
	},

	undefined: function(object, memberName, objectName, excludingMemberName) {
		if (is.defined(object[memberName])) {
			throw new TypeError(`Cannot specify ${objectName}.${memberName} because ${excludingMemberName} is specified.`);
		}
	},

	vector3: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.vector3(value)) return value;
		throw new TypeError(`${objectName}.${memberName} must be a 3D vector`);
	},

	weight: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.default(value)) return 1;
		if (is.positiveNumber(value)) return value;
		throw new RangeError(`${objectName}.${memberName} must be a positive number`);
	},

	_getValue: function(object, memberName) {
		return memberName.length === 0 ? object : object[memberName];
	},

	_interpolationArray: function(object, memberName, objectName) {
		const value = object[memberName];
		const name = objectName + '.' + memberName;
		if (!is.array(value) || value.length < 2) {
			throw new RangeError(name + ' must be an array with at least 2 elements');
		}
		const result = [];
		let lastT;
		for (let i = 0; i < value.length; i++) {
			const tvPair = value[i];
			if (!is.object(tvPair) || !is.number(tvPair.t) || !is.number(tvPair.v)) {
				throw new RangeError(`${name}[${i}] must be an object with 't' and 'v' number members`);
			}
			const t = tvPair.t;
			if (i === 0) {
				if (t !== 0) {
					throw new RangeError(name + '[0].t must be 0');
				}
			} else if (lastT >= t) {
				throw new RangeError(`${name}[${i-1}].t (${lastT})must be less than ${name}[${i}].t (${t})`);
			} else if (t > 1) {
				throw new RangeError(`${name}[${i}].t cannot be greater than 1`);
			}
			lastT = t;
			result.push({...tvPair});
		}
		if (lastT !== 1) {
			throw new RangeError(`${name}[${value.length - 1}].t must be 1`);
		}
		return result;
	},

	_resolveName: function(objectName, memberName) {
		return memberName.length === 0 ? objectName : (objectName + '.' + memberName);
	},
}

const merge = {
	default: {
		precision: .01,
		trackBank: 0,
		trackWidth: 1,
		wallHeight: .5,
	},
	settings: function(parentSettings, overrideSettings, name) {
		const mergedSettings = {...parentSettings};
		for (let vs of this._validSettings) {
			if (is.defined(overrideSettings[vs.key])) {
				mergedSettings[vs.key] = vs.validator ?
					vs.validator(overrideSettings, vs.key, name) :
					overrideSettings[vs.key];
			}
		}
		return mergedSettings;
	},
	_validSettings: [
		{ key: 'debug' },
		{ key: 'debugSegments' },
		{ key: 'precision', validator: validate.positiveNumber },
		{ key: 'trackBank', validator: validate.trackBank, },
		{ key: 'trackWidth', validator: validate.positiveNumber },
		{ key: 'wallHeight', validator: validate.positiveNumber },
	],
}

const trig = {
	_oneZeroTolerance: .0001,
	_degreeTolerance: .1,
	clampAt0And1: function(v, tolerance) {
		if (!is.defined(tolerance)) tolerance = this._oneZeroTolerance;
		if (Math.abs(v) < tolerance) return 0;
		if (Math.abs(v - 1) < tolerance) return 1;
		if (Math.abs(v + 1) < tolerance) return -1;
		return v;
	},
	clampDegrees: function(d, tolerance) {
		if (!is.defined(tolerance)) tolerance = this._degreeTolerance;
		if (d < 0) d += 360;
		if (d < tolerance) return 0;
		if (Math.abs(d - 90) < tolerance) return 90;
		if (Math.abs(d - 180) < tolerance) return 180;
		if (Math.abs(d - 270) < tolerance) return 270;
		return d;
	},
	degreesToRadians: Math.PI / 180,
	normalizeAngle: function(angle) {
		let v = angle % 360;
		if (v > 180) v -= 360;
		if (v <= -180) v += 360;
		return v;
	},
	radiansToDegrees: 180 / Math.PI,
}

const vector = {
	_defaultTolerance: 0.0001,
	add: function(u, k, v) {
		return {
			x: u.x + k * v.x,
			y: u.y + k * v.y,
			z: u.z + k * v.z,
		}
	},
	cross: function(u, v) {
		return {
			x: u.y * v.z - u.z * v.y,
			y: u.z * v.x - u.x * v.z,
			z: u.x * v.y - u.y * v.x,
		}
	},
	difference: function(from, to) {
		return {
			x: to.x - from.x,
			y: to.y - from.y,
			z: to.z - from.z,
		};
	},
	distance: function(u, v) {
		return vector.length(this.difference(u, v));
	},
	dot: function(u, v) {
		return u.x * v.x + u.y * v.y + u.z * v.z;
	},
	down: { x:0, y:-1, z:0 },
	interpolate: function(u, v, t) {
		const olt = 1 - t;
		return {
			x: olt * u.x + t * v.x,
			y: olt * u.y + t * v.y,
			z: olt * u.z + t * v.z,
		}
	},
	forward: { x:0, y:0, z:1 },
	left: { x:-1, y:0, z:0 },
	length: function(u) {
		return Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
	},
	midpoint: function(u, v) {
		return {
			x: (u.x + v.x) / 2,
			y: (u.y + v.y) / 2,
			z: (u.z + v.z) / 2,
		}
	},
	multiply: function(k, u) {
		return {
			x: k * u.x,
			y: k * u.y,
			z: k * u.z,
		}
	},
	normalize: function(u) {
		const length = vector.length(u);
		return {
			x: u.x / length,
			y: u.y / length,
			z: u.z / length,
		};
	},
	right: { x:1, y:0, z:0 },
	rotate: function(axis, u, angle) {
		const theta = angle * trig.degreesToRadians;
		const cosTheta = Math.cos(theta);
		const sinTheta = Math.sin(theta);
		let result = vector.multiply(cosTheta, u);
		result = vector.add(result, sinTheta, vector.cross(axis, u));
		return vector.add(result, vector.dot(axis, u) * (1 - cosTheta), axis);
	},
	sum: function(coeffs, us) {
		let sum = vector.zero;
		for (let i = 0; i < coeffs.length; i++) {
			sum = vector.add(sum, coeffs[i], us[i]);
		}
		return sum;
	},
	to: function(from, to) { return this.normalize(this.difference(from, to)) },
	up: { x:0, y:1, z:0 },
	zero: { x:0, y:0, z:0 },
};

class CylindricalCoordinate {

	#angle;
	#height;
	#radius;

	constructor(radius, angle, height) {
		this.#radius = radius;
		this.#angle = angle;
		this.#height = height;
	}

	get angle() { return this.#angle }
	get radius() { return this.#radius }
	get height() { return this.#height }
}

class Line {

	#origin;
	#normal;

	constructor(origin, normal) {
		this.#origin = origin;
		this.#normal = vector.normalize(normal);
	}

	get normal() { return this.#normal }
	get origin() { return this.#origin }
}

class Plane {

	static #defaultTolerance = 0.95;

	#normal;
	#origin;
	#xAxis;
	#yAxis;

	constructor(origin, normal) {
		this.#origin = origin;
		this.#normal = vector.normalize(normal);
	}

	get normal() { return this.#normal }
	get origin() { return this.#origin }

	contains(vertex, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		return this.#getHeight(vertex) < (1 - tolerance);
	}
	getCylindricalCoordinate(vertex) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const toVertex = this.#toVertex(vertex);

		const x = vector.dot(this.#xAxis, toVertex);
		const y = vector.dot(this.#yAxis, toVertex);
		const angle = trig.clampDegrees(Math.atan2(y, x) * trig.radiansToDegrees);

		const height = this.#getHeightTo(toVertex);
		const radius = vector.length(vector.add(toVertex, -height, this.#normal));

		return new CylindricalCoordinate(radius, angle, height)
	}
	getIntersection(other) {

		// NOTE: Technically this returns a line in the form of
		// a point p on the line and a direction d of the line.
		// This conveniently can be interpreted as describing a
		// plane with origin p and normal d. We abuse this
		// by describing the line as an object with members
		// 'origin' and 'normal', identical to the plane notation.

		// Get the line direction. Normalize should throw an error if the
		// planes are parallel
		const direction = vector.normalize(vector.cross(this.#normal, other.#normal));

		// TODO: Figure out why this works
		// see https://forum.unity.com/threads/how-to-find-line-of-intersecting-planes.109458/

		// Next is to calculate a point on the line to fix it's position.
		// This is done by finding a vector from the plane2 [other] location,
		// moving parallel to it's plane, and intersecting plane1. To
		// prevent rounding errors, this vector also has to be perpendicular
		// to lineDirection [ldir]. To get this vector, calculate the cross
		// product of the normal of plane2 [other] and the lineDirection [ldir].
		const ldir = vector.cross(other.#normal, direction);

		const numerator = vector.dot(this.#normal, ldir);

		// Prevent divide by zero.
		if (Math.abs(numerator) < .0001) return new Line(vector.zero, direction);

		const b2a = vector.add(this.#origin, -1, other.#origin);
		const t = vector.dot(this.#normal, b2a) / numerator;
		return new Line(vector.add(other.#origin, t, ldir), direction);
	}
	getHelixAt(cylPoint, declination, debug) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const theta = cylPoint.angle * trig.degreesToRadians;
		const cos = trig.clampAt0And1(Math.cos(theta));
		const sin = trig.clampAt0And1(Math.sin(theta));

		const radial = vector.add(vector.multiply(cos, this.#xAxis), sin, this.#yAxis);
		const point = vector.add(vector.add(this.#origin, cylPoint.radius, radial), cylPoint.height, this.#normal);
		let forward = vector.add(vector.multiply(-sin, this.#xAxis), cos, this.#yAxis);
		if (debug) console.log('Plane.getHelixAt: declination %f, forward %o', declination, forward);
		if (Math.abs(declination) > 0.01) {
			forward = vector.rotate(radial, forward, declination);
			if (debug) console.log('Plane.getHelixAt: after forward %o', forward);
		}

		return {
			point: point,
			forward: forward,
		}
	}
	isParallel(other, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		return Math.abs(vector.dot(this.#normal, other.#normal)) >= tolerance;
	}
	isSame(other, tolerance) {
		return this.isParallel(other, tolerance) && this.contains(other.#origin, tolerance);
	}
	setAxes(xAxis) {
		this.#xAxis = vector.normalize(vector.add(xAxis, -vector.dot(xAxis, this.#normal), this.#normal));
		this.#yAxis = vector.cross(this.#xAxis, this.#normal);
	}

	#getHeight(vertex) {
		return this.#getHeightTo(this.#toVertex(vertex));
	}
	#getHeightTo(toVertex) {
		return vector.dot(this.#normal, toVertex);
	}
	#setDefaultAxes() {
		if (vector.dot(vector.up, this.#normal) > Plane.#defaultTolerance) {
			this.setAxes(vector.right);
		} else if (vector.dot(vector.down, this.#normal) > Plane.#defaultTolerance) {
			this.#normal = vector.multiply(-1, this.#normal);
			this.setAxes(vector.right);
		} else {
			console.log('Plane.#setDefaultAxes: normal %o, dot up %f, dot down %f',
				this.#normal,
				vector.dot(vector.up, this.#normal),
				vector.dot(vector.down, this.#normal));
			throw 'Plane.#setDefaultAxes: not implemented';
		}
	}
	#toVertex(vertex) {
		return vector.add(vertex, -1, this.#origin);
	}
}

const ribbonMgr = {

	// A ribbon is an array of four arrays of vectors representing the [0] left
	// wall top, [1] left road edge, [2] right road edge, and [3] right wall
	// top.

	add: function(ribbon, bp, vectorFactory) {
		const left = vector.cross(bp.forward, bp.down);
		const wall = vector.multiply(-bp.wallHeight, bp.down);
		const edgeDistance = bp.trackWidth / 2;
		const leftEdge = vector.add(bp.center, edgeDistance, left);
		const rightEdge = vector.add(bp.center, -edgeDistance, left);
		ribbon[0].push(vectorFactory(vector.add(leftEdge, 1, wall)));
		ribbon[1].push(vectorFactory(leftEdge));
		ribbon[2].push(vectorFactory(rightEdge));
		ribbon[3].push(vectorFactory(vector.add(rightEdge, 1, wall)));
	},

	create: function() {
		return [ [], [], [], [] ];
	},
}

const bezier = {

	build: function(ribbon, sp0, sp1, vectorFactory, precision) {

		// Compute the Bezier cubic curve points
		const curve = {
			points: [
				sp0.center,
				vector.add(sp0.center, sp0.forwardWeight, sp0.forward),
				vector.add(sp1.center, -sp1.backwardWeight, sp1.forward),
				sp1.center,
			],
			trackBanks: [ bezier._getDown(sp0), bezier._getDown(sp1) ],
			trackWidths: [ sp0.trackWidth, sp1.trackWidth ],
			wallHeights: [ sp0.wallHeight, sp1.wallHeight ],
		}

		// Fill out the curve
		const bpt0 = bezier._getPoint(curve, 0);
		const bpt1 = bezier._getPoint(curve, 1);
		bezier._interpolate(ribbon, curve, 0, 1, bpt0, bpt1, vectorFactory, precision);

		// Return the points array
		return bpt1;
	},

	_getDown: function(sp) {

		// We are done if we already have a vector
		if (is.vector3(sp.trackBank)) return sp.trackBank;

		// Compute the true 'down' vector. This must be orthogonal to the forward vector.
		// Remove any component of the down vector inline with the forward vector.
		let down = vector.down;
		const dot = vector.dot(sp.forward, down);
		if (Math.abs(dot) > .0001)  {
			down = vector.normalize(vector.add(down, -dot, sp.forward));
		}

		// Rotate the down vector if there is banking
		if (Math.abs(sp.trackBank) > .0001) {
			down = vector.rotate(sp.forward, down, sp.trackBank);
		}

		return vector.normalize(down);
	},

	_getPoint: function(curve, t) {
		const olt = 1 - t;	// one less t

		// Compute the point at t
		// v(t) = (1-t)^3*p0 + 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3*p3
		let coeffs = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
		const center = vector.sum(coeffs, curve.points);

		// Compute the forward vector with is the tangent at t
		// v'(t) = 3*(1-t)^2*(p1 - p0) + 6*(1-t)*t*(p2-p1) + 3*t^2*(p3-p2).
		// Note that we normalize this to get a unit vector.
		coeffs = [3 * olt *olt, 6 * olt * t, 3 * t * t];
		const deltaPoints = [
			vector.add(curve.points[1], -1, curve.points[0]),
			vector.add(curve.points[2], -1, curve.points[1]),
			vector.add(curve.points[3], -1, curve.points[2]),
		];
		const forward = vector.normalize(vector.sum(coeffs, deltaPoints));

		// Compute the track width and wall height through linear interpolation
		const trackWidth = olt * curve.trackWidths[0] + t * curve.trackWidths[1];
		const wallHeight = olt * curve.wallHeights[0] + t * curve.wallHeights[1];

		// Interpolate the down vector
		const down = vector.normalize(vector.interpolate(curve.trackBanks[0], curve.trackBanks[1], t));

		return {
			center: center,				// center line position at t
			down: down,					// Down vector at t
			forward: forward,			// Forward vector at t
			trackWidth: trackWidth,
			wallHeight: wallHeight,
		};
	},

	// Generate the Bezier cubic curve between t0 and t1
	_interpolate: function(ribbon, curve, t0, t1, bpt0, bpt1, vectorFactory, precision) {

		// NOTE: A cubic Bezier curve generates points, or slices in our case,
		// p0, ..., pn where p0 is the point at t0 and pn is the point at t1.
		// However, for consecutive curves c and d, the last point of c is the
		// same as the first point of d. To avoid duplication of points in the
		// ribbon, this routine only adds points p0, ..., pn-1. Note that same
		// holds for contiguous sections of a curve.

		// Calculate the linear and curve midpoints of the current subsection
		const midtime = (t0 + t1) / 2;
		const lmp = vector.midpoint(bpt0.center, bpt1.center);	// Linear midpoint
		const bmp = this._getPoint(curve, midtime);				// Bezier midpoint

		// TODO: This precision test is insufficient. It is possible for the curve to pass
		// through the linear midpoint but the tangent at the midpoint be different (e.g.,
		// an 'S' curve passing through the midpoint).

		// If the linear midpoint is close enough to the curve midpoint, add bmp0
		// to the  ribbon. Otherwise recursively add the sections of the curve
		// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
		// the midpoint calcuated here.
		if (vector.distance(lmp, bmp.center) <= precision) {
			ribbonMgr.add(ribbon, bpt0, vectorFactory);
		} else {
			this._interpolate(ribbon, curve, t0, midtime, bpt0, bmp, vectorFactory, precision);
			this._interpolate(ribbon, curve, midtime, t1, bmp, bpt1, vectorFactory, precision);
		}
	},
}

const pointParser = {

	parse: function(builders, points, rawPoint, parentSettings, name) {
		const point = this.validate(rawPoint, parentSettings, name);
		points.push(point);
		if (points.length > 1) builders.push(createBuilder(parentSettings));
	},

	validate: function(rawPoint, parentSettings, name) {

		// The raw point cannot have a 'precision' element
		if (is.defined(rawPoint.precision)) {
			throw new TypeError(`${name} cannot define precision`);
		}

		// Create the point with its settings and name
		const point = merge.settings(parentSettings, rawPoint, name);
		point.name = name;

		// The raw point must have a center object with x, y, and z numeric
		// elements
		point.center = validate.vector3(rawPoint, 'center', name);

		// The point must have a forward vector
		point.forward = vector.normalize(validate.vector3(rawPoint, 'forward', name));

		// Get the weights
		point.forwardWeight = validate.weight(rawPoint, 'forwardWeight', name);
		point.backwardWeight = validate.weight(rawPoint, 'backwardWeight', name);

		return point;
	}
}

const spiralParser = {

	/*--------------------------------------------------------------------------
	THEORETICAL FOUNDATION

	A spiral section has (a) a center of the rotation, (b) a normalized
	rotation axis, (c) an entry point, (d) an exit point, and (e) a number of
	full rotations, or turns, between the entry and exit points.

	Let the rotation plane be the plane defined by the center and rotation
	axis with the plane's normal being the rotation axis.

	Note that the rotation axis, being on one side or the other of the plane,
	determines if the sprial turns left or right relative to the perceived
	'up' of the entry point.

	Let the rotation plane have an arbitrary 'x' axis or 0° vector,
	orthogonal to the rotation axis.

	Note that all points projected on the rotation plane can be expressed in
	polar coordinates [d, θ] where d is the distance of the projection from
	the center point and θ is the angle off the plane's x axis.

	Let the entry and exit projection points be the projections of the entry
	and exit points onto the rotation plane.

	Let the entry and exit angles be the angle components of the projection
	points' polar cooordinates.

	Let the entry and exit radii be the distances of the projection points'
	polar coordinates.

	Note that the radii do not need to be the same. This allows for the
	construction of increasing or decreasing radii curves.

	Let the sweep of the spiral being the sum of (a) 360° times the number
	of turns and (b) the difference between the entry and exit angles in the
	direction of rotation.

	Let the entry and exit altitudes be the distances of the entry and exit
	points from the rotation plane. Note that this is the dot product of the
	points and the rotation axis.

	Note that the altitudes may have the same sign as the spiral does not
	need to pass through the rotation plane.

	Furthermore, note that if the altitudes are the same, all points on the
	spiral have the same altitude and the number of turns should be 0.

	--------------------------------------------------------------------------*/

	parse: function(builders, points, rawSpiral, parentSettings, name) {
		const specs = this._getSpecs(points, rawSpiral, parentSettings, name);
		this._generate(builders, points, specs, rawSpiral, parentSettings, name);
	},

	_circleWeight: 0.5519150244935105707435627,

	/*--------------------------------------------------------------------------
	SPECIFICATION

	As stated above, we need these elements to be specified:
	(a) the rotation center and axis which define the rotation plane
	(b) the entry and exit angles
	(c) the entry and exit altitudes
	(d) the entry and exit radii
	(e) the number of turns
	(f) The entry point if the sprial starts the segment.

	Note that if the spiral starts a segment, the entry point implicitly
	supplies the entry angle, altitude, and radius.

	'endsAt' (required)
		If specified, sets the exit point of the spiral. This object
		must define the 'x', 'y', and 'z' coordinate values of the
		vector and a 'forward' vector. A 'forwardWeight' is optional.
	'rotate' (required)
		This is either 'left', 'right', or 'up' and determines how the
		spiral rotates relative to the entry point.
	'startsAt' (required if the spiral starts the track segment)
		This sets the entry point of the spiral. This is illegal if the
		spiral does not start the segment. This object must define
		the 'x', 'y', and 'z' coordinate values of the vector and
		a 'forward' vector.
	'turns' (optional)
		If specified, this positive integer sets the number of complete
		rotations in the spiral.

	--------------------------------------------------------------------------*/

	_getSpecs: function(points, rawSpiral, parentSettings, name) {

		// Create the settings and base spiral specification
		const settings = merge.settings(parentSettings, rawSpiral, name);
		const specs = {
			debug: settings.debug,
			debugSegments: settings.debugSegments,
		};

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

		// Get the endsAt
		specs.endsAt = pointParser.validate(rawSpiral.endsAt, settings, name + '.endsAt');

		// Determine the rotation plane.
		specs.rotationPlane = this._getRotationPlane(specs, rotate, rawSpiral, name);

		// Now that we have the rotation plane, we can compute the angles,
		// altitudes, and radii
		const entry = this._getCylindricalCoordinate(specs, 'startsAt');
		const exit = this._getCylindricalCoordinate(specs, 'endsAt');

		// Set the sweep and declination
		const { sweep, invertTangent, startAngle, endAngle } = this._getSweep(specs, rotate, turns, entry, exit);
		const deltaAltitude = exit.height - entry.height;
		const declination = Math.abs(deltaAltitude) < .001 ? 0 : (Math.atan2(deltaAltitude, sweep) * trig.radiansToDegrees);
		if (settings.debug) {
			console.log('_getSpecs: deltaAltitude %f, sweep %f, declination %f', deltaAltitude, sweep, declination);
		}
		specs.declination = invertTangent ? (180 - declination) : declination;
		specs.sweep = sweep;

		// Set the interpolation functions
		specs.height = this._getInterpolation(entry.height, exit.height);
		specs.angle = this._getInterpolation(startAngle, endAngle);
		specs.radius = this._getInterpolation(entry.radius, exit.radius);

		// Set the trackBank multiplier
		specs.trackBank = settings.trackBank;
		if (rotate === 'left') specs.trackBankMultiplier = 1;
		else if (rotate === 'right') specs.trackBankMultiplier = -1;
		else throw '_getSpecs: trackBankMultiplier not implemented';

		// Return the specifications
		return specs;
	},

	_getCylindricalCoordinate: function(specs, memberName) {
		return specs.rotationPlane.getCylindricalCoordinate(specs[memberName].center)
	},

	_getInterpolation: function(t0, t1) {
		const delta = t1 - t0;
		return Math.abs(delta) < .001 ?
			(t) => { return t0; } :
			(t) => { return t0 + t * delta; };
	},

	_getRotationAxis: function(specs, rotate) {
		// TODO: This assumes the rotation axis is either up or up X forward.
		// This may not always be the case.
		if (rotate === 'left' || rotate === 'right') return vector.up;
		throw '_getRotationAxis: not implemented for non-up axis';
	},

	_getRotationPlane: function(specs, rotate, rawSpiral, name) {

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
					const center = validate.vector3(rawSpiral, 'center', name);
					const isAboveBelow = function(plane, point) {
						const planeUp = vector.normalize(vector.add(vector.up, -vector.dot(vector.up, plane.normal), plane.normal));
						const toPoint = vector.to(plane.origin, point);
						const d = vector.dot(planeUp, toPoint);
						return Math.abs(d) > .95;
					}
					if (isAboveBelow(entryPlane, center)) {
						throw `${name}: center and entry points are too close vertically; center must have some offset`;
					}
					if (isAboveBelow(exitPlane, center)) {
						throw `${name}: center and exit points are too close vertically; center must have some offset`;
					}
					rotCenter = center;
					rotAxis = this._getRotationAxis(specs, rotate);
				} else {
					throw '_getRotationPlane: not implemented, center, rotate up identical entry and exit planes';
				}
			} else if (rotate === 'left' || rotate === 'right') {
				const toEnd = vector.to(entryPlane.origin, exitPlane.origin);
				const d = vector.dot(vector.up, toEnd);
				if (Math.abs(d) >= .9) {
					throw `${name}: starting and ending points are too close vertically; center required`;
				}
				rotCenter = vector.midpoint(entryPlane.origin, exitPlane.origin);
				rotAxis = this._getRotationAxis(specs, rotate);
			} else {
				throw '_getRotationPlane: not implemented, no center, rotate up identical entry and exit planes';
			}
		} else if (entryPlane.isParallel(exitPlane)) {
			/*const center = validate.vector3(rawSpiral, 'center', name);
			if (rotate === 'left') {
				throw '_getRotationPlane: make sure centernot implemented, parallel entry and exit planes';
			} else if (rotate === 'right') {
			} else {
			}*/
			throw '_getRotationPlane: not implemented, parallel entry and exit planes';
		} else {
			// 'center' is illegal
			validate.undefined(rawSpiral, 'center', name);

			// Get intersection of the planes, a line, and use this as
			// the rotation center and axis
			const line = entryPlane.getIntersection(exitPlane);
			rotCenter = line.origin;
			rotAxis = line.normal;
		}

		// Return the rotation plane
		return new Plane(rotCenter, rotAxis);
	},

	_getSweep: function(specs, rotate, turns, entry, exit) {
		const turnsDegrees = turns * 360;
		let sweep, invertTangent, startAngle = entry.angle, endAngle = exit.angle;
		if (rotate === 'left') {
			if (startAngle > endAngle) endAngle += 360;
			endAngle += turnsDegrees;
			sweep = endAngle - startAngle;
			invertTangent = false;
		} else if (rotate === 'right') {
			if (startAngle < endAngle) endAngle -= 360;
			endAngle -= turnsDegrees;
			sweep = startAngle - endAngle;
			invertTangent = true;
		} else {
			throw '_setSweep: need to compute sweep up';
		}
		return {
			endAngle: endAngle,
			invertTangent: invertTangent,
			startAngle: startAngle,
			sweep: sweep,
		}
	},

	/*--------------------------------------------------------------------------
	IMPLEMENTATION

	TODO: Determine if the rotation direction coefficient is needed. The
	rotation functions may handle this innately.

	Note that the rotation direction is either 1 or -1 to reflect,
	respectively, a counterclockwise or clockwise rotation.

	First we need a series of parametric functions on t = 0 to 1.

	Let Sweep(t) return the linearly interpolated sweep between 0 at t = 0
	and the spiral's sweep at t = 1.

	Let Altitude(t) return the linearly interpolated altitude between the
	entry altitude at t = 0 and the exit altitude at t = 1.

	Let Radius(t) return the linearly interpolated radius between the entry
	radius at t = 0 and the exit radius at t = 1.

	Let Angle(t) return the sum of the entry angle and the product of
	Sweep(t) and rotation direction, normalized to the range [0°, 360°).

	Let PlanarPoint(t) return the point at [Radius(t), Angle(t)].

	Let Point(t) return the sum of PlanarPoint(t) and the product of
	Altitude(t) and the rotation axis.

	Now let Spiral(u) be a Bezier cubic function to compute the spiral
	points.

	The current implementation of the Bezier cubic curve for circles
	requires that a circle be partitioned into 90° segments. The Bezier
	function Spiral(u) treat u = 0 as 0° and u = 1 as 90°.

	This requires the top-level algorithm to break the sprial into a series
	of 90 sections [0°, 90°], [90°, 180°], ..., [(k-1)90°, k90°] where
	(k-1)90° < the spiral's sweep <= k90°. This requires additional
	arguments to the Bezier function to allow mapping of u onto the
	parameteric argument t in the other functions. Also note that the for
	the last section, even though Point(k90°) is used to determine the
	the control points of the curve, range of points produced are up to
	Point(sweep).

	--------------------------------------------------------------------------*/

	_generate: function(builders, points, specs, rawSpiral, parentSettings, name) {

		// Insert the entry point if this is the first point of the segment.
		// Otherwise patch its forwardWeight if required.
		if (points.length === 0) points.push(specs.startsAt);
		let p = points[points.length - 1];
		p.forwardWeight = specs.radius(0) * this._circleWeight;
		p.trackBank = this._processInterpolationArray(specs.trackBank, 0, specs.trackBankMultiplier);

		// Add the 90° sections
		for (let angle = 90; angle < specs.sweep; angle += 90) {
			this._addPoint(builders, points, angle / specs.sweep, specs, rawSpiral, parentSettings, name);
		}

		// Add the last point
		specs.endsAt.backwardWeight = specs.radius(1) * this._circleWeight;
		specs.endsAt.trackBank = this._processInterpolationArray(specs.trackBank, 1, specs.trackBankMultiplier);
		points.push(specs.endsAt);
		builders.push(createBuilder(parentSettings));
	},

	_addPoint: function(builders, points, t, specs, rawSpiral, parentSettings, name) {
		const cylPoint = new CylindricalCoordinate(specs.radius(t), specs.angle(t), specs.height(t));
		const declination = specs.declination;

		const polar = specs.rotationPlane.getHelixAt(cylPoint, declination, specs.debug);

		const pointName = `${name}@${cylPoint.angle}`;
		const point = merge.settings(parentSettings, rawSpiral, pointName);
		point.backwardWeight = cylPoint.radius * this._circleWeight;
		point.center = polar.point;
		point.forward = polar.forward;
		point.forwardWeight = point.backwardWeight;
		point.name = pointName;
		point.trackBank = this._processInterpolationArray(specs.trackBank, t, specs.trackBankMultiplier);

		points.push(point);
		builders.push(createBuilder(parentSettings));
	},

	_processInterpolationArray: function(value, t, multiplier) {
		if (is.vector3(value)) return value;
		if (is.number(value)) return multiplier * value;
		if (t <= 0) return multiplier * value[0].v;
		if (t >= 1) return multiplier * value[value.length - 1].v;
		for (let i = 1; i < value.length; i++) {
			if (t >= value[i-1].t && t <= value[i].t) {
				return multiplier * (value[i-1].v * (1 - t) + value[i].v * t);
			}
		}
		throw '_processInterpolationArray: Something went wrong';
	},
}

const straightParser = {

	parse: function(builders, points, rawStraight, parentSettings, name) {

		// All straight sections have either (a) a length or (b) an ending vertex.
		// If a length is specified, the ending vertex is the starting vertex plus
		// length times the forward direction at the starting vertex.

		// A straight section starting a segment must have a starting vertex. If
		// it has a length, it must also have a forward direction.

		// Any interior straight section uses the last segment point as its starting
		// vertex. Hence it cannot specify a starting vertex or forward direction at
		// the start of the straight section.

		// The ending segment point is the ending vertex with a forward direction
		// of the ending vertex less the starting vertex, normalized. The straight
		// section's 'forwardWeight' and 'backwardWeight' are applied to this segment
		// point.

		// NOTE: It is possible that the starting point's forward direction is
		// different from the ending point's forward direction.

		// If the section starts the segment and needs to control the starting vertex'same
		// forward weight, use the 'startingWeight' setting for the straight.

		// Check that the ending vertex or length is specified.
		const usesLength = is.defined(rawStraight.length);
		const usesEndsAt = is.defined(rawStraight.endsAt);
		if (!usesLength && !usesEndsAt) {
			throw new TypeError(`${name} must define 'length' or 'endsAt'`);
		}
		if (usesLength && usesEndsAt) {
			throw new TypeError(`${name} cannot define both 'length' and 'endsAt'`);
		}

		// Create the end point with its settings and name
		const endPoint = merge.settings(parentSettings, rawStraight, name);
		endPoint.name = name;
		if (usesEndsAt) {
			endPoint.center = validate.vector3(rawStraight, 'endsAt', name);
		}

		// Get the starting vertex
		let startPoint;
		const generateStart = points.length === 0;
		if (!generateStart) {
			startPoint = points[points.length - 1];
		} else {
			startPoint = merge.settings(parentSettings, rawStraight, name);
			startPoint.name = name + '*';
			startPoint.center = validate.vector3(rawStraight, 'startsAt', name);
			startPoint.forwardWeight = validate.weight(rawStraight, 'startingWeight', name);
			if (usesEndsAt) {
				endPoint.forward = vector.normalize(vector.difference(startPoint.center, endPoint.center));
				startPoint.forward = endPoint.forward;
			} else {
				startPoint.forward = validate.vector3(rawStraight, 'forward', name);;
			}
		}

		// Compute the end point's center and forward
		if (usesLength) {
			const length = validate.positiveNumber(rawStraight, 'length', name);
			endPoint.center = vector.add(startPoint.center, length, startPoint.forward);
			endPoint.forward = startPoint.forward;
		} else if (!generateStart) {
			endPoint.forward = vector.normalize(vector.difference(startPoint.center, endPoint.center));
		}

		// Get the weights
		endPoint.forwardWeight = validate.weight(rawStraight, 'forwardWeight', name);
		endPoint.backwardWeight = validate.weight(rawStraight, 'backwardWeight', name);

		// And we are done!
		if (generateStart) points.push(startPoint);
		points.push(endPoint);
		builders.push(createBuilder(parentSettings));
	}
}

const sectionParser = {

	parse: function(builders, points, rawPoint, parentSettings, name) {

		// The raw point must be an object
		validate.object(rawPoint, name);

		// Check the type
		const sectionType = is.defined(rawPoint.type) ? rawPoint.type : 'point';
		const sectionParser = this._parsers[sectionType];
		if (!is.defined(sectionParser)) {
			throw new TypeError(`${name}.type of '${sectionType}' is not recognized`);
		}

		// Parse the section
		sectionParser.parse(builders, points, rawPoint, parentSettings, name);
	},

	_parsers: {
		point: pointParser,
		spiral: spiralParser,
		straight: straightParser,
	},
}

function createBuilder(settings) {
	return {
		precision: settings.precision
	}
}

function executeBuilder(builder, ribbon, sp0, sp1, vectorFactory) {
	return bezier.build(ribbon, sp0, sp1, vectorFactory, builder.precision);
}

function buildSegment(segment, vectorFactory, parentSettings, isClosed, name) {

	// Segment must be an object
	validate.object(segment, name);

	// Create settings
	const settings = merge.settings(parentSettings, segment, name);

	// Make sure that 'points' is an array with at least one element
	validate.sizedArray(segment, 'points', name, 1);

	// Reform the points array into two arrays of n section builders and
	// n+1 segment points
	const builders = [];
	const points = [];
	for (let i = 0; i < segment.points.length; i++) {
		sectionParser.parse(builders, points, segment.points[i], settings, `${name}.points[${i}]`);
	}
	if (settings.debugSegments) {
		for (let i = 0; i < points.length; i++) console.log('buildSegment: %o', points[i]);
	}

	// Ensure we have at least one builder and two segment points
	validate.sizedArray(points, '', name, 2);

	// Loop through the builders, creating curves between them
	const ribbon = ribbonMgr.create();
	let lastPoint = null;
	for (let i = 0; i < builders.length; i++) {
		lastPoint = executeBuilder(builders[i], ribbon, points[i], points[i+1], vectorFactory);
	}

	// If this is not a closed segment, add the last point to the ribbon
	if (!isClosed) {
		ribbonMgr.add(ribbon, lastPoint, vectorFactory, settings);
	}

	return ribbon;
}

function buildTrack(track, vectorFactory, parentSettings) {

	// Create settings
	const settings = merge.settings(parentSettings, track, 'track');

	// Make sure that 'segments' is an array with at least one element
	validate.sizedArray(track, 'segments', 'track', 1);

	// Check if this is a closed track
	const isClosed = track.segments.length == 1 && track.closed;

	// Loop through the segments
	const ribbons = [];
	for (let i = 0; i < track.segments.length; i++) {
		const ribbon = buildSegment(
			track.segments[i],
			vectorFactory,
			settings,
			isClosed,
			'track.segments[' + i.toString() + ']');
		ribbons[i] = ribbon;
	}
	return ribbons;
}

/*==========================================================================
API

specs			a specification object or a json serialization of a
				specification object
vectorFactory	function to build an application friendly 3D vector,
				v = vectorFactory(u) where u has keys x, y, z.
settings		application settings for the build
*/

const TrackPOC = {

	build: function(specs, vectorFactory, appSettings = {}) {

		// Validate the arguments
		const objSpecs = validate.jsonOrObject(specs, 'specs');
		if (!is.function(vectorFactory)) {
			throw new TypeError('vectorFactory must be a function');
		}
		if (!is.object(appSettings)) {
			throw new TypeError('appSettings must be an object');
		}

		// Create a settings block. This also validates the settings.
		const settings = merge.settings(merge.default, appSettings, 'appSettings');

		// Build the ribbons
		return buildTrack(objSpecs, vectorFactory, settings);
	},

	vector: {
		direction: function(from, to) {
			return vector.normalize(vector.difference(from, to));
		}
	},
}
