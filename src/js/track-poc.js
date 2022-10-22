import {
	AmmoJSPlugin, ArcRotateCamera,
	Engine, FreeCamera,
	HemisphericLight, Mesh,
	MeshBuilder, PhysicsImpostor,
	Scene, SceneLoader,
	Vector3 as BabylonVector3,
} from "@babylonjs/core";

import ammo from "ammo.js";

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

	undefined: function(object, memberName, objectName, reason) {
		if (is.defined(object[memberName])) {
			throw new TypeError(`Cannot specify ${objectName}.${memberName} because ${reason}.`);
		}
	},

	vector3: function(object, memberName, objectName) {
		const value = object[memberName];
		if (is.vector3(value)) return new Vector3(value);
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
		{ key: 'altDeclination' },
		{ key: 'altDeclinationAlgo' },
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

class Vector {

	coordinates;
	static #clampTolerance = .001;

	constructor(dimension) {
		this.coordinates = []
		if (is.integer(dimension)) {
			for (let i = 0; i < dimension; i++) this.coordinates[i] = 0;
		} else {
			for (let i = 0; i < dimension.length; i++) this.coordinates[i] = dimension[i];
		}
	}

	get dimension() { return this.coordinates.length }

	add(k, v) {
		return this.#makeVector((i) => this.coordinates[i] + k * v.coordinates[i])
	}
	clamp(tolerance) {
		if (!is.defined(tolerance)) tolerance = Vector.#clampTolerance;
		for (let i = 0; i < this.dimension; i++) {
			if (Math.abs(this.coordinates[i]) < tolerance) this.coordinates[i] = 0;
		}
		return this;
	}
	distance(v) { return this.to(v).length() }
	dot(v) {
		return this.#makeSum((i) => this.coordinates[i] * v.coordinates[i]);
	}
	interpolate(v, t) {
		const olt = 1 - t;
		return this.#makeVector((i) => olt * this.coordinates[i] + t * v.coordinates[i])
	}
	length() {
		return Math.sqrt(this.#makeSum((i) => this.coordinates[i] * this.coordinates[i]));
	}
	midpoint(v) {
		return this.#makeVector((i) => (this.coordinates[i] + v.coordinates[i]) / 2)
	}
	newHack() {
		throw new InternalError('Vector.newHack must be overridden')
	}
	normalize() {
		const length = this.length();
		return this.#makeVector((i) => this.coordinates[i] / length);
	}
	scale(k) {
		return this.#makeVector((i) => k * this.coordinates[i])
	}
	to(v) {
		return this.#makeVector((i) => v.coordinates[i] - this.coordinates[i])
	}
	toNormal(v) { return this.to(v).normalize() }

	static scaledSum(vectors, scalars) {
		let sum = vectors[0].scale(scalars[0]);
		for (let i = 1; i < scalars.length; i++) {
			sum = sum.add(scalars[i], vectors[i]);
		}
		return sum;
	}

	#makeVector(f) {
		const result = this.newHack();
		for (let i = 0; i < result.dimension; i++) result.coordinates[i] = f(i);
		return result;
	}
	#makeSum(f) {
		let result = 0;
		for (let i = 0; i < this.dimension; i++) result += f(i);
		return result;
	}
}

class Vector3 extends Vector {

	static #backward = new Vector3(0, 0, -1)
	static #down = new Vector3(0, -1, 0)
	static #forward = new Vector3(0, 0, 1)
	static #left = new Vector3(-1, 0, 0)
	static #right = new Vector3(1, 0, 0)
	static #up = new Vector3(0, 1, 0)
	static #zero = new Vector3(0, 0, 0)

	constructor(x, y, z) {
		super(3);
		if (!is.defined(x)) {
		} else if (x instanceof Vector3) {
			for (let i = 0; i < 3; i++) this.coordinates[i] = x.coordinates[i];
		} else if (is.vector3(x)) {
			this.coordinates[0] = x.x;
			this.coordinates[1] = x.y;
			this.coordinates[2] = x.z;
		} else {
			this.coordinates[0] = x;
			this.coordinates[1] = y;
			this.coordinates[2] = z;
		}
	}

	get x() { return this.coordinates[0] }
	get y() { return this.coordinates[1] }
	get z() { return this.coordinates[2] }

	static get backward() { return Vector3.#backward }
	static get down() { return Vector3.#down }
	static get forward() { return Vector3.#forward }
	static get left() { return Vector3.#left }
	static get right() { return Vector3.#right }
	static get up() { return Vector3.#up }
	static get zero() { return Vector3.#zero }

	cross(v) {
		return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
	}
	newHack() { return new Vector3() }
	rotate(axis, angle) {
		if (!(axis instanceof Vector3)) throw new Error('Vector3.rotate: axis is not a Vector3');
		if (!is.number(angle)) throw new Error('Vector3.rotate: angle is not a number');
		const theta = angle * trig.degreesToRadians;
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		return this.scale(cos).add(sin, axis.cross(this)).add(this.dot(axis) * (1 - cos), axis);
	}
}

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

	interpolate(other, t) {
		const olt = 1 - t;
		return new CylindricalCoordinate(
			olt * this.#radius + t * other.#radius,
			olt * this.#angle + t * other.#angle,
			olt * this.#height + t * other.#height)
	}
}

class Line {

	#origin;
	#normal;

	constructor(origin, normal) {
		this.#origin = origin;
		this.#normal = normal.normalize();
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
		this.#normal = normal.normalize();
	}

	get normal() { return this.#normal }
	get origin() { return this.#origin }
	get xAxis() { return this.#xAxis }
	get yAxis() { return this.#yAxis }

	contains(vertex, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		return this.#getHeight(vertex) < (1 - tolerance);
	}
	getCylindricalCoordinate(vertex) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const toVertex = this.#toVertex(vertex);

		const x = this.#xAxis.dot(toVertex);
		const y = this.#yAxis.dot(toVertex);
		const angle = trig.clampDegrees(Math.atan2(y, x) * trig.radiansToDegrees);

		const height = this.#getHeightTo(toVertex);
		const radius = toVertex.add(-height, this.#normal).length();

		return new CylindricalCoordinate(radius, angle, height)
	}
	getIntersection(other, options) {

		// Get the line direction. Normalize should throw an error if the
		// planes are parallel
		if (!(other instanceof Plane)) throw new Error('Plane.getIntersection: other is not a Plane');
		const direction = this.#normal.cross(other.#normal).normalize();
		const clamp = options && options.clamp;
		if (clamp) direction.clamp();

		// TODO: Figure out why this works
		// see https://forum.unity.com/threads/how-to-find-line-of-intersecting-planes.109458/

		// Next is to calculate a point on the line to fix it's position.
		// This is done by finding a vector from the plane2 [other] location,
		// moving parallel to it's plane, and intersecting plane1. To
		// prevent rounding errors, this vector also has to be perpendicular
		// to lineDirection [ldir]. To get this vector, calculate the cross
		// product of the normal of plane2 [other] and the lineDirection [ldir].
		const ldir = other.#normal.cross(direction);

		const numerator = this.#normal.dot(ldir);

		// Prevent divide by zero.
		if (Math.abs(numerator) < .0001) {
			return new Line(Vector3.zero, direction);
		} else {
			const b2a = other.#origin.to(this.#origin);
			const t = this.#normal.dot(b2a) / numerator;
			const origin = other.#origin.add(t, ldir);
			return new Line(origin, direction);
		}
	}
	getHelixAt(cylPoint, options) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const theta = cylPoint.angle * trig.degreesToRadians;
		const cos = trig.clampAt0And1(Math.cos(theta));
		const sin = trig.clampAt0And1(Math.sin(theta));

		const radial = this.#xAxis.scale(cos).add(sin, this.#yAxis);
		const point = this.#origin.add(cylPoint.radius, radial).add(cylPoint.height, this.#normal);

		const forward = options.getForward(this, cos, sin, radial, options);

		return {
			point: point,
			forward: forward,
		}
	}
	isParallel(other, tolerance) {
		if (!is.defined(tolerance)) tolerance = Plane.#defaultTolerance;
		const dot = this.#normal.dot(other.#normal);
		return Math.abs(dot) >= tolerance;
	}
	isSame(other, tolerance) {
		return this.isParallel(other, tolerance) && this.contains(other.#origin, tolerance);
	}
	setAxes(xAxis) {
		if (!(xAxis instanceof Vector3)) throw new Error('Plane.setAxes: xAxis is not a Vector3');
		this.#xAxis = xAxis.add(-xAxis.dot(this.#normal), this.#normal).normalize();
		this.#yAxis = this.#xAxis.cross(this.#normal);
	}

	#getHeight(vertex) {
		return this.#getHeightTo(this.#toVertex(vertex));
	}
	#getHeightTo(toVertex) {
		return this.#normal.dot(toVertex);
	}
	#setDefaultAxes() {
		if (Vector3.up.dot(this.#normal) > Plane.#defaultTolerance) {
			this.setAxes(Vector3.right);
		} else if (Vector3.down.dot(this.#normal) > Plane.#defaultTolerance) {
			this.#normal = this.#normal.scale(-1);
			this.setAxes(Vector3.right);
		} else {
			console.log('Plane.#setDefaultAxes: normal %o, dot up %f, dot down %f',
				this.#normal,
				Vector3.up.dot(this.#normal),
				Vector3.down.dot(this.#normal));
			throw new Error('Plane.#setDefaultAxes: not implemented');
		}
	}
	#toVertex(vertex) {
		return this.#origin.to(vertex);
	}
}

const ribbonMgr = {

	// A ribbon is an array of four arrays of vectors representing the [0] left
	// wall top, [1] left road edge, [2] right road edge, and [3] right wall
	// top.

	add: function(ribbon, bp, vectorFactory) {
		const left = bp.forward.cross(bp.down);
		const wall = bp.down.scale(-bp.wallHeight);
		const edgeDistance = bp.trackWidth / 2;
		const leftEdge = bp.center.add(edgeDistance, left);
		const rightEdge = bp.center.add(-edgeDistance, left);
		ribbon[0].push(vectorFactory(leftEdge.add(1, wall)));
		ribbon[1].push(vectorFactory(leftEdge));
		ribbon[2].push(vectorFactory(rightEdge));
		ribbon[3].push(vectorFactory(rightEdge.add(1, wall)));
	},

	create: function() {
		return [ [], [], [], [] ];
	},
}

const bezier = {

	build: function(ribbon, sp0, sp1, vectorFactory, precision) {

		// Compute the Bezier cubic curve points
		const curve = {
			points: [],
			trackBanks: [ bezier._getDown(sp0), bezier._getDown(sp1) ],
			trackWidths: [ sp0.trackWidth, sp1.trackWidth ],
			wallHeights: [ sp0.wallHeight, sp1.wallHeight ],
		}
		curve.points[0] = sp0.center;
		curve.points[1] = curve.points[0].add(sp0.forwardWeight, sp0.forward);
		curve.points[3] = sp1.center;
		curve.points[2] = curve.points[3].add(-sp1.backwardWeight, sp1.forward);

		// Fill out the curve
		const bpt0 = bezier._getPoint(curve, 0);
		const bpt1 = bezier._getPoint(curve, 1);
		bezier._interpolate(ribbon, curve, 0, 1, bpt0, bpt1, vectorFactory, precision);

		// Return the last point
		return bpt1;
	},

	_getDown: function(sp) {

		// We are done if we already have a vector
		if (is.vector3(sp.trackBank)) return new Vector3(sp.trackBank);

		// Compute the true 'down' vector. This must be orthogonal to the forward vector.
		// Remove any component of the down vector inline with the forward vector.
		let down = Vector3.down;
		const dot = sp.forward.dot(down);
		if (Math.abs(dot) > .0001)  {
			down = down.add(-dot, sp.forward);
		}

		// Rotate the down vector if there is banking
		if (Math.abs(sp.trackBank) > .0001) {
			down = down.rotate(sp.forward, sp.trackBank);
		}

		return down.normalize();
	},

	_getPoint: function(curve, t) {
		const olt = 1 - t;	// one less t

		// Compute the point at t
		// v(t) = (1-t)^3*p0 + 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3*p3
		const vScalars = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
		const center = Vector3.scaledSum(curve.points, vScalars);

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

		// Interpolate the down vector
		const down = curve.trackBanks[0].interpolate(curve.trackBanks[1], t).normalize();

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
		const lmp = bpt0.center.midpoint(bpt1.center);	// Linear midpoint
		const bmp = this._getPoint(curve, midtime);		// Bezier midpoint

		// TODO: This precision test is insufficient. It is possible for the curve to pass
		// through the linear midpoint but the tangent at the midpoint be different (e.g.,
		// an 'S' curve passing through the midpoint).

		// If the linear midpoint is close enough to the curve midpoint, add bmp0
		// to the  ribbon. Otherwise recursively add the sections of the curve
		// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
		// the midpoint calcuated here.
		if (lmp.distance(bmp.center) <= precision) {
			ribbonMgr.add(ribbon, bpt0, vectorFactory);
		} else {
			this._interpolate(ribbon, curve, t0, midtime, bpt0, bmp, vectorFactory, precision);
			this._interpolate(ribbon, curve, midtime, t1, bmp, bpt1, vectorFactory, precision);
		}
	},
}

const pointParser = {

	parse: function(builders, points, rawPoint, parentSettings, name) {
		points.push(this.validate(rawPoint, parentSettings, name));
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
		point.forward = validate.vector3(rawPoint, 'forward', name).normalize();

		// Get the weights
		point.forwardWeight = validate.weight(rawPoint, 'forwardWeight', name);
		point.backwardWeight = validate.weight(rawPoint, 'backwardWeight', name);

		return point;
	}
}

const spiralParser = {

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

	parse: function(builders, points, rawSpiral, parentSettings, name) {
		const specs = this._getSpecs(points, rawSpiral, parentSettings, name);
		this._generate(builders, points, specs, rawSpiral, parentSettings, name);
	},

	_circleWeight: 0.5519150244935105707435627,

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

	_getSpecs: function(points, rawSpiral, parentSettings, name) {

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
		specs.rotationPlane = this._getRotationPlane(specs, rotate, rawSpiral, name);

		// Now that we have the rotation plane, we can compute the angles,
		// altitudes, and radii
		specs.entry = this._getCylindricalCoordinate(specs, 'startsAt');
		specs.exit = this._getCylindricalCoordinate(specs, 'endsAt');

		// Set the sweep
		const { sweep, endAngle } = this._getSweep(specs, rotate, turns);
		if (endAngle !== specs.exit.angle) {
			specs.exit = new CylindricalCoordinate(specs.exit.radius, endAngle, specs.exit.height);
		}
		specs.sweep = sweep;
		if (is.number(settings.altDeclination)) specs.altDeclination = settings.altDeclination;
		else if (is.string(settings.altDeclination)) specs.altDeclination = Number(settings.altDeclination);
		specs.altDeclinationAlgo = is.string(settings.altDeclinationAlgo) ? settings.altDeclinationAlgo : '_getPointForward';

		// Set the trackBank multiplier
		specs.trackBank = settings.trackBank;
		if (rotate === 'left') specs.trackBankMultiplier = 1;
		else if (rotate === 'right') specs.trackBankMultiplier = -1;
		else throw new Error('spiralParser._getSpecs: trackBankMultiplier not implemented');

		// Return the specifications
		return specs;
	},

	_getCylindricalCoordinate: function(specs, memberName) {
		return specs.rotationPlane.getCylindricalCoordinate(specs[memberName].center)
	},

	_getRotationAxis: function(specs, rotate) {
		// TODO: This assumes the rotation axis is either up or forward.
		// This may not always be the case.
		if (rotate === 'left' || rotate === 'right') return Vector3.up;
		throw new Error('_getRotationAxis: not implemented for non-up axis');
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
					rotAxis = this._getRotationAxis(specs, rotate);
				} else {
					throw new Error('_getRotationPlane: not implemented, center, rotate up identical entry and exit planes');
				}
			} else if (rotate === 'left' || rotate === 'right') {
				const toEnd = entryPlane.origin.toNormal(exitPlane.origin);
				const d = Vector3.up.dot(toEnd);
				if (Math.abs(d) >= .9) {
					throw new Error(`${name}: starting and ending points are too close vertically; center required`);
				}
				rotCenter = entryPlane.origin.midpoint(exitPlane.origin);
				rotAxis = this._getRotationAxis(specs, rotate);
			} else {
				throw new Error('_getRotationPlane: not implemented, no center, rotate up identical entry and exit planes');
			}
		} else if (entryPlane.isParallel(exitPlane)) {
			/*const center = validate.vector3(rawSpiral, 'center', name);
			if (rotate === 'left') {
				throw new Error('_getRotationPlane: make sure centernot implemented, parallel entry and exit planes');
			} else if (rotate === 'right') {
			} else {
			}*/
			throw new Error('_getRotationPlane: not implemented, parallel entry and exit planes');
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
	},

	_getSweep: function(specs, rotate, turns) {
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
	},

	/*--------------------------------------------------------------------------
	IMPLEMENTATION

	The _getSpecs function compiles the user specification into an algorithm
	friendly specification. Hereout, the term specification refers to this
	algorithm friedly form.

	'sweep' is the difference between the entry and exit points' angles
	including 360° times the number of turns. This is always positive.

	As with all good parametric algorithms, the algorithm execute functions
	providing 0 <= t <= 1, representing an angle of the helix between 0 and
	sweep.

	Given t, we can now linearly interpolate between the cylindrical
	coordinates of the entry and exit points. Note that _getSpecs adjusts
	the angle of the exit point to reflect clockwise or counterwise rotation.

	The current implementation of the Bezier cubic curve for circles
	requires that a circle be partitioned into 90° segments. The entry
	point is t = 0. Additional points at 90°, 180°, ..., (k-1)90°, where
	sweep < k90°, are generated. The exit point is also used.

	Note that the Bezier algorithm requires the tangent or forward direction
	of these intermediate points.

	--------------------------------------------------------------------------*/

	_generate: function(builders, points, specs, rawSpiral, parentSettings, name) {

		// Insert the entry point if this is the first point of the segment.
		// Otherwise patch its forwardWeight if required.
		if (points.length === 0) points.push(specs.startsAt);
		const p = points[points.length - 1];
		p.forwardWeight = specs.entry.radius * this._circleWeight;
		p.trackBank = this._processInterpolationArray(specs.trackBank, 0, specs.trackBankMultiplier);

		// Add the 90° points
		for (let angle = 90; angle < specs.sweep; angle += 90) {
			this._addPoint(builders, points, angle / specs.sweep, specs, rawSpiral, parentSettings, name);
		}

		// Add the last point
		specs.endsAt.backwardWeight = specs.exit.radius * this._circleWeight;
		specs.endsAt.trackBank = this._processInterpolationArray(specs.trackBank, 1, specs.trackBankMultiplier);
		points.push(specs.endsAt);
		builders.push(createBuilder(parentSettings));
	},

	_addPoint: function(builders, points, t, specs, rawSpiral, parentSettings, name) {
		const cylPoint = specs.entry.interpolate(specs.exit, t);
		if (specs.debug) {
			console.log('spiralParser._addPoint(%f): entry %o, exit %o, interpolated %o',
				t, specs.entry, specs.exit, cylPoint);
		}

		const options = {
			debug: specs.debug,
			getForward: this._getPointForward,
			altDeclination: specs.altDeclination,
			depth: specs.exit.height - specs.entry.height,
			rotate: specs.rotate,
			sweep: specs.sweep,
		};
		const polar = specs.rotationPlane.getHelixAt(cylPoint, options);

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

	_getPointForward: function(plane, cos, sin, radial, options) {
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
			console.log('spiralParser._getPointForward: options %o', options);
		}

		if (options.rotate !== 'left' && options.rotate !== 'right') {
			throw new Error(`spiralParser._getPointForward: ${options.rotate} not implemented`);
		}

		const tangents = [];

		// TODO: The forward vector is not yet correct.
		//	'appearsToWork' seems to work for turns >= 4 but fails for turns <= 1
		//	'fromDerivative' seems to work for sweeps < 2π but fails otherwise
		const absDepth = Math.abs(options.depth);
		if (absDepth <= 0.1) tangents[1] = Vector3.zero;
		else {

			// NOTE: This mostly works with
			const appearsToWork = 1 / options.depth;
			const fromDerivative = options.depth / (options.sweep * trig.degreesToRadians);
			const toUse =
				is.defined(options.altDeclination) ? options.altDeclination :
				options.sweep <= 360 ? fromDerivative : appearsToWork;
			if (options.debug) {
				console.log('\tappearsToWork %f, fromDerivative %f, using %f',
					appearsToWork, fromDerivative, toUse);
			}
			tangents[1] = plane.normal.scale(toUse);
		}

		if (options.debug) console.log('\tY component %o', tangents[1]);

		const k =
			options.rotate === 'left' ? 1 :
			options.rotate === 'right' ? -1 :
			0;
		tangents[0] = plane.xAxis.scale(-k * sin);
		tangents[2] = plane.yAxis.scale(k * cos);

		const forward = Vector3.scaledSum(tangents, [1, 1, 1]).normalize().clamp();
		if (options.debug) console.log('\tforward %o', forward);
		return forward;
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
		throw new Error('_processInterpolationArray: Something went wrong');
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
				endPoint.forward = startPoint.center.toNormal(endPoint.center);
				startPoint.forward = endPoint.forward;
			} else {
				startPoint.forward = validate.vector3(rawStraight, 'forward', name);;
			}
		}

		// Compute the end point's center and forward
		if (usesLength) {
			const length = validate.positiveNumber(rawStraight, 'length', name);
			endPoint.center = startPoint.center.add(length, startPoint.forward);
			endPoint.forward = startPoint.forward;
		} else if (!generateStart) {
			endPoint.forward = startPoint.center.toNormal(endPoint.center);
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
}

//======================================================================
// ERROR DISPLAY MANAGER

const errorDisplay = {
	clear: function() {
		this._trackError.style.display = "none";
		this._disable(false);
	},

	show: function(e) {
		console.log(e);
		this._trackError.style.display = "block";
		this._trackErrorText.innerText = e.toString();
		this._disable(true);
	},

	init: function(div, text, disableOnError = []) {
		this._trackError = document.getElementById(div);
		this._trackErrorText = document.getElementById(text);
		this._disableOnError = [];
		for (let id of disableOnError) {
			this._disableOnError.push(document.getElementById(id));
		}
		debugDisplay.disable();
		declinationDisplay.disable();
	},

	_disable: function(disable) {
		for (let element of this._disableOnError) {
			element.disabled = disable;
		}
	},
}

//======================================================================
// DEBUG MANAGER

const debugDisplay = {

	disable: function() {
		for (let elem of this._elements) {
			elem.element.disabled = true;
			elem.element.checked = false;
		}
	},

	register: function(track) {
		this._track = track;
		for (let elem of this._elements) {
			elem.element.disabled = false;
			elem.element.checked = track[elem.member];
		}
	},

	init: function(debugIds) {
		for (let id of debugIds) {
			const elem = document.getElementById(id);
			if (!elem) throw new Error('Cannot find debug id ' + id);
			if (!elem.hasAttribute('member')) throw new Error(`Element ${id} must have a 'member' attribute`);

			this._elements.push({ element: elem, member: elem.getAttribute('member')});
			elem.disabled = true;
			elem.checked = false;
			elem.addEventListener("click", (e) => { this._onClick(e) });
		}
	},

	_onClick: function(event) {
		if (this._track) {
			const checkbox = event.target;
			const member = checkbox.getAttribute('member')
			this._track[member] = checkbox.checked;
			if (checkbox.checked) tracks.createMesh();
		}
	},

	_elements: [],
}

//======================================================================
// DECLINATION MANAGER

const declinationDisplay = {

	disable: function(state = true) {
		if (this._valueInput) {
			this._valueInput.disable = state;
			this._resetButton.disable =  state;
			this._clearButton.disable = state;
			this._algoSelector.disable = state;
		}
	},

	register: function(track) {
		if (!track || track.altDeclination === null || track.altDeclination === undefined) {
			this._track = false;
		} else {
			this._track = track;
			this._valueInput.value = track.altDeclination;
		}

		this._styleRule.style = "display:" + (this._track ? "block" : "none");
	},

	init: function(styleSheetTitle, styleSelector, input) {

		// Find the style sheet
		for (let sheet of document.styleSheets) {
			if (styleSheetTitle === sheet.title) {
				this._styleSheet = sheet;
				break;
			}
		}
		if (!this._styleSheet) throw new Error('declinateDisplay.init: Cannot find stylesheet ' + styleSheetTitle);

		// Find the rule
		if (this._styleSheet) {
			for (let rule of this._styleSheet.cssRules) {
				if (rule instanceof CSSStyleRule && rule.selectorText === styleSelector) {
					this._styleRule = rule;
					break;
				}
			}
			if (!this._styleRule) throw new Error('declinateDisplay.init: Cannot find selector ' + styleSelector);
		}

		// Find the user input elements
		this._valueInput = document.getElementById(input);
		this._valueInput.addEventListener("change", (e) => this._onChangeValue(e));
		this._resetButton = document.getElementById(input + "Reset");
		this._resetButton.addEventListener("click", (e) => this._onReset(e));
		this._clearButton = document.getElementById(input + "Clear");
		this._clearButton.addEventListener("click", (e) => this._onClear(e));
		this._algoSelector = document.getElementById(input + "Algo");
		this._algoSelector.addEventListener("change", (e) => this._onChangeAlgo(e));

		// Trigger the initial display
		this.register();
	},

	_onChangeAlgo: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},

	_onChangeValue: function(e) {
		console.log(e);
		const value = Number(this._valueInput.value);
		if (value != this._track.altDeclination) {
			this._track.altDeclination = value;
			tracks.createMesh();
		}
	},

	_onClear: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},

	_onReset: function(e) {
		console.log(e);
		throw new Error('Not implemented');
	},
}

//======================================================================
// BABYLON SUPPORT

const babylon = {
	createDefaultEngine: function() {
		if (!this._canvas) throw "Must invoke setCanvas first";
		this._engine = new Engine(this._canvas, true, {
			preserveDrawingBuffer: true,
			stencil: true,
			disableWebGL2Support: false
		});
		return this._engine;
	},
	createRibbon: function(name, ribbon, closed, meshOptions) {
		if (!this._scene) throw "Must invoke createScene first";
		const mesh = MeshBuilder.CreateRibbon(
			name,
			{
				pathArray: ribbon,
				sideOrientation: Mesh.DOUBLESIDE,
				closePath: closed,
			},
			this._scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, this._scene);
		return mesh;
	},
	createScene: function () {
		if (!this._canvas) throw "Must invoke setCanvas first";
		if (!this._engine) throw "Must invoke createDefaultEngine first";
		this._scene = new Scene(this._engine);
		const camera = new ArcRotateCamera(
			"Camera",
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			BabylonVector3.Zero());
		camera.attachControl(this._canvas, true);
		const light = new HemisphericLight("hemi", new BabylonVector3(0, 50, 0));
		this._scene.enablePhysics(new BabylonVector3(0, -8.91, 0), new AmmoJSPlugin());
		return this._scene;
	},
	createSphere: function(name, sphereOptions, impostorOptions) {
		if (!this._scene) throw "Must invoke createScene first";
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, this._scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, this._scene);
		return mesh;
	},
	destroyMesh: function(mesh) {
		if (!this._scene) throw "Must invoke createScene first";
		if (mesh) {
			this._scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	},
	ready: function() {
		if (!this._scene) throw "Must invoke createScene first";
		this._ready = true;
	},
	resize: function() { if (this._engine) this._engine.resize(); },
	setCanvas: function(id) { this._canvas = document.getElementById(id); },
	startRenderLoop: function () {
		if (!this._engine) throw "Must invoke createDefaultEngine first";
		this._engine.runRenderLoop(function () {
			if (babylon._ready && babylon._scene.activeCamera) {
				babylon._scene.render();
			}
		});
	},
}

//======================================================================
// BALL SUPPORT

const ball = {

	_diameter: .25,
	_height: 1,
	_inset: .8,
	_weight: 2,

	destroy: function() {
		this._mesh = babylon.destroyMesh(this._mesh);
	},
	setButton(id) {
		document.getElementById(id).addEventListener('click', (e) => { this._drop(e) });
	},

	_drop: function(e) {
		console.log(e);
		ball.destroy();
		const {p0, p1} = tracks.getTrackStart();
		const t = ball._inset;
		const olt = 1 - t;
		ball._mesh = babylon.createSphere("ball", {diameter: ball._diameter}, {mass: ball._weight});
		ball._mesh.position.x = p0.x * t + p1.x * olt;
		ball._mesh.position.y = p0.y * t + p0.y * olt + ball._height;
		ball._mesh.position.z = p0.z * t + p1.z * olt;
	},
}

//======================================================================
// TRACK MANAGEMENT

const tracks = {
	getTrackStart: function() { return this._start; },
	register: function(track) {

		// Invoke function if not an object
		if (typeof(track) === 'function') track = track();

		// Perform late initialization
		if (track.init) track.init();

		// Get the family
		if (!track.family && !track.sibling) throw "A track must define either 'family' or 'sibling'";
		if ((track.family || track.sibling) && (track.name || track.desc)) throw "A track defining 'family' or 'sibling' cannot define 'name' or 'desc'";
		if (track.sibling && !track.sibling.family) throw `A 'sibling' track, here '${track.sibling}', must define 'family'`;
		const family = track.family ? track.family : track.sibling.family;
		const familyKey = this._removeSpaces(family);

		// Get the member
		if (track.sibling && !track.member) throw "A track defining 'sibling' must also define 'member'";
		if (track.sibling && track.member && track.member === this._originalMember) {
			throw `A track defining 'sibling' cannot have 'member' set to '${this._originalMember}'`;
		}
		const member = track.member ? track.member : this._originalMember;
		const memberKey = familyKey + this._removeSpaces(member);
		const key = familyKey + memberKey;

		// Add family if necessary
		if (!this._families[familyKey]) {
			// This possibly leads to multiple member lists to avoid
			// altering the 'display' style in onFamilyChanged
			this._families[familyKey] = [];

			// Add the family to the family list
			const fsOption = document.createElement("option");
			fsOption.setAttribute('value', familyKey);
			fsOption.innerHTML = family;
			this._familySelector.appendChild(fsOption);
		}

		// Add to member selector
		const msOption = document.createElement("option");
		msOption.setAttribute('value', key);
		msOption.setAttribute('family', familyKey);
		msOption.innerHTML = member;
		this._memberSelector.appendChild(msOption);

		// Add the track to the tracks and options arrays
		this._tracks[key] = track.track;
		if (track.options) this._options[key] = track.options;

		return track;
	},
	setSelectors: function(familyId, membersId) {
		this._familySelector = document.getElementById(familyId);
		this._memberSelector = document.getElementById(membersId);
		this._familySelector.addEventListener("change", () => this._onFamilyChanged());
		this._memberSelector.addEventListener("change", () => this._onMemberChanged());
	},
	start: function() {
		if (!this._familySelector || !this._memberSelector) throw "Must invoke setSelectors first";
		this._onFamilyChanged();
	},

	createMesh: function() {
		ball.destroy();
		for (let mesh of this._meshes) babylon.destroyMesh(mesh);
		this._meshes.length = 0;

		try {
			const key = this._memberSelector.value;
			const track = this._tracks[key];
			const settings = this._options[key] ? this._options[key] : {};

			debugDisplay.register(track);
			declinationDisplay.register(track);

			const ribbons = TrackPOC.build(track, (u) => { return new BabylonVector3(u.x, u.y, u.z); }, settings);
			const ribbon = ribbons[0];
			const leftRoad = ribbon[1];
			const rightRoad = ribbon[2];
			const p0left = leftRoad[0];
			const p0right = rightRoad[0];
			const p1left = leftRoad[1];
			const p1right = rightRoad[1];
			this._start = {
				p0: {
					x: (p0left.x + p0right.x) / 2,
					y: (p0left.y + p0right.y) / 2,
					z: (p0left.z + p0right.z) / 2,
				},
				p1: {
					x: (p1left.x + p1right.x) / 2,
					y: (p1left.y + p1right.y) / 2,
					z: (p1left.z + p1right.z) / 2,
				},
			}
			for (let i = 0; i < ribbons.length; i++) {
				tracks._meshes.push(babylon.createRibbon(`Segment${i}`, ribbons[i], track.closed, { mass: 0 }));
			}
			errorDisplay.clear();
		} catch (e) {
			errorDisplay.show(e);
		}
	},

	_onFamilyChanged: function() {
		const key = this._familySelector.value;
		let firstMatch = -1;
		for (let i = 0; i < this._memberSelector.options.length; i++) {
			const option = this._memberSelector.options[i];
			const match = option.getAttribute("family") === key;
			option.style.display = match ? "block" : "none";
			if (match && firstMatch === -1) firstMatch = i;
		}
		if (firstMatch !== -1) this._memberSelector.selectedIndex = firstMatch;
		this.createMesh();
	},
	_onMemberChanged: function() { this.createMesh(); },

	_families: {},
	_meshes: [],
	_options: {},
	_originalMember: 'Original',
	_removeSpaces: function(value) { return value.replace(/\s/g, ''); },
	_tracks: {},
};

//======================================================================
// TRACK DEFINITION

const posX = Vector3.right;
const negX = Vector3.left;
const posY = Vector3.up;
const negY = Vector3.down;
const posZ = Vector3.forward;
const negZ = Vector3.backward;
const zero = Vector3.zero;

const defineTracks = function() {

	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	const circleWeight = 0.5519150244935105707435627;

	//----------------------------------------------------------------------
	// Closed ovals

	const track0 = tracks.register({
		family: 'Closed oval',
		points: [
			{ center: new BabylonVector3(2, 0, 0), forward: posZ },	// Start position
			{ center: new BabylonVector3(2, 0, 4), forward: posZ },
			{ center: new BabylonVector3(0, 0, 6), forward: negX },
			{ center: new BabylonVector3(-2, 0, 4), forward: negZ },
			{ center: new BabylonVector3(-2, 0, -4), forward: negZ },
			{ center: new BabylonVector3(0, 0, -6), forward: posX },
			{ center: new BabylonVector3(2, 0, -4), forward: posZ },
		],
		track: { closed: true },
		options: {
			backwardWeight: 0.5,
			forwardWeight: 0.5,
			trackWidth: 0.5,
		},
		init: function() {
			this.track.segments = [ { points: this.points } ];
		}
	});
	tracks.register({
		sibling: track0,
		member: 'Variable wall height',
		options: track0.options,
		track: {
			closed: true,
			segments: [
				{
					points: [
						track0.points[0],
						{ center: track0.points[1].center, forward: track0.points[1].forward, wallHeight: .6 },
						{ center: track0.points[2].center, forward: track0.points[2].forward, wallHeight: .7 },
						{ center: track0.points[3].center, forward: track0.points[3].forward, wallHeight: .6 },
						track0.points[4],
						track0.points[5],
						track0.points[6],
					],
				},
			],
		},
	});

	//----------------------------------------------------------------------
	// Common launch and jump points

	const launch = {
		start: {
			center: { x:10 , y:5, z:0 }
		},
		end: {
			center: { x:9, y:4.9, z:0 },
		},

		init: function() {
			this.start.forward = {
				x: this.end.center.x - this.start.center.x,
				y: this.end.center.y - this.start.center.y,
				z: this.end.center.z - this.start.center.z,
			};
			this.end.forward = this.start.forward;
			this.straight = {
				type: 'straight',
				endsAt: this.end.center,
				startsAt: this.start.center,
				forwardWeight: 1.1
			};
		},
	}
	launch.init();

	const jump = {
		descent: 1,
		launchSegment: {
			points: [
				launch.straight,
				{
					center: { x:.5, y:1, z:0 },
					forward: negX,
					backwardWeight: 4,
				},
			],
		},
		radius: 2,

		_catchDrop: .1,
		_gap: 1,

		init: function() {
			const launchEnd = this.launchSegment.points[this.launchSegment.points.length - 1];
			this.catchStart = {
				center: {
					x: launchEnd.center.x - this._gap,
					y: launchEnd.center.y - this._catchDrop,
					z: launchEnd.center.z,
				},
				forward: negX,
			}
			this.catchEnd = {
				center: {
					x: this.catchStart.center.x - this.radius + this._gap / 2,
					y: this.catchStart.center.y - this.descent / 4,
					z: this.catchStart.center.z
				},
				forward: negX,
			}
			this.runout = {
				type: 'straight',
				length: 2 * this.radius,
			}
		},
	}
	jump.init();

	const parametricBank = [
		{ t:0, v:10 },
		{ t:1/3, v:23 },
		{ t:2/3, v:23 },
		{ t:1, v:10 },
	]

	//----------------------------------------------------------------------
	// Simple slope

	const track1 = tracks.register({
		family: "Simple slope",
		runoutStart: {
			center: zero,
			forward: negX,
			backwardWeight: 4,
		},
		runoutStraight: {
			type: 'straight',
			length: 2,
		},

		init: function() {
			this.track = {
				segments: [
					{
						points: [
							launch.start,
							launch.end,
							this.runoutStart,
							this.runoutStraight,
						],
					}
				],
			};
		}
	});
	const track1a = tracks.register({
		sibling: track1,
		member: 'Variable track width',
		runoutStraight: {
			type: 'straight',
			length: track1.runoutStraight.length,
			trackWidth: 2,
		},

		init: function() {
			this.track = {
				segments: [
					{
						points: [
							launch.start,
							launch.straight,
							track1.runoutStart,
							this.runoutStraight,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track1,
		member: "Alternate straight",
		track: {
			segments: [
				{
					points: [
						{
							type: 'straight',
							startsAt: launch.end.center,
							forward: launch.end.forward,
							length: 1.004987562112089,
							forwardWeight: 1.1
						},
						track1.runoutStart,
						track1a.runoutStraight,
					],
				},
			],
		},
	});

	//----------------------------------------------------------------------
	// Left turn ramp

	const track2 = tracks.register({
		family: "Left turn ramp",

		curveEnd: {
			backwardWeight: circleWeight * jump.radius,
			forward: posZ,
		},
		curveLeft: {
			backwardWeight: circleWeight * jump.radius,
			forward: posX,
			forwardWeight: circleWeight * jump.radius,
		},
		curveStart: {
			center: jump.catchEnd.center,
			forward: jump.catchEnd.forward,
			forwardWeight: circleWeight * jump.radius,
		},
		curveTop: {
			backwardWeight: circleWeight * jump.radius,
			forward: negZ,
			forwardWeight: circleWeight * jump.radius,
		},

		init: function() {
			this.curveTop.center = {
				x: this.curveStart.center.x - jump.radius,
				y: this.curveStart.center.y - jump.descent / 4,
				z: this.curveStart.center.z - jump.radius,
			}
			this.curveLeft.center = {
				x: this.curveTop.center.x + jump.radius,
				y: this.curveTop.center.y - jump.descent / 4,
				z: this.curveTop.center.z - jump.radius
			}
			this.curveEnd.center = {
				x: this.curveLeft.center.x + jump.radius,
				y: this.curveLeft.center.y - jump.descent / 4,
				z: this.curveLeft.center.z + jump.radius
			}
			this.track = {
				segments: [
					jump.launchSegment,
					{
						points: [
							jump.catchStart,
							this.curveStart,
							this.curveTop,
							this.curveLeft,
							this.curveEnd,
							jump.runout,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track2,
		member: "45&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					{
						center: track2.curveStart.center,
						forward: track2.curveStart.forward,
						forwardWeight: track2.curveStart.forwardWeight,
						trackBank: 10,
					},
					{
						backwardWeight: track2.curveTop.backwardWeight,
						center: track2.curveTop.center,
						forward: track2.curveTop.forward,
						forwardWeight: track2.curveTop.forwardWeight,
						trackBank: 45,
					},
					{
						backwardWeight: track2.curveLeft.backwardWeight,
						center: track2.curveLeft.center,
						forward: track2.curveLeft.forward,
						forwardWeight: track2.curveLeft.forwardWeight,
						trackBank: 45,
					},
					{
						backwardWeight: track2.curveEnd.backwardWeight,
						center: track2.curveEnd.center,
						forward: track2.curveEnd.forward,
						trackBank: 10,
					},
					jump.runout
				],
			}],
		},
	});
	tracks.register({
		sibling: track2,
		member: "Using spiral (cheat -.1)",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track2.curveEnd.center,
							forward: track2.curveEnd.forward,
						},
						rotate: 'left',
					},
					jump.runout
				],
			}],
			debug: true,
			altDeclination: -.1,
		},
	});
	tracks.register({
		sibling: track2,
		member: "Using spiral with 23&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track2.curveEnd.center,
							forward: track2.curveEnd.forward,
						},
						rotate: 'left',
						trackBank: parametricBank,
					},
					jump.runout
				],
			}],
		},
	});

	//----------------------------------------------------------------------
	// Right turn ramp

	const track3 = tracks.register({
		family: "Right turn ramp",

		curveEnd: {
			backwardWeight: circleWeight * jump.radius,
			forward: negZ,
		},
		curveRight: {
			backwardWeight: circleWeight * jump.radius,
			forward: posX,
			forwardWeight: circleWeight * jump.radius,
		},
		curveStart: track2.curveStart,
		curveTop: {
			backwardWeight: circleWeight * jump.radius,
			forward: posZ,
			forwardWeight: circleWeight * jump.radius,
		},

		init: function() {
			this.curveTop.center = {
				x: this.curveStart.center.x - jump.radius,
				y: this.curveStart.center.y - jump.descent / 4,
				z: this.curveStart.center.z + jump.radius,
			}
			this.curveRight.center = {
				x: this.curveTop.center.x + jump.radius,
				y: this.curveTop.center.y - jump.descent / 4,
				z: this.curveTop.center.z + jump.radius
			}
			this.curveEnd.center = {
				x: this.curveRight.center.x + jump.radius,
				y: this.curveRight.center.y - jump.descent / 4,
				z: this.curveRight.center.z - jump.radius
			}
			this.track = {
				segments: [
					jump.launchSegment,
					{
						points: [
							jump.catchStart,
							this.curveStart,
							this.curveTop,
							this.curveRight,
							this.curveEnd,
							jump.runout,
						],
					},
				],
			}
		},
	});
	tracks.register({
		sibling: track3,
		member: "45&#176; bank",
		track: { segments: [
			jump.launchSegment,
			{ points: [
				jump.catchStart,
				{
					center: track3.curveStart.center,
					forward: track3.curveStart.forward,
					forwardWeight: track3.curveStart.forwardWeight,
					trackBank: -10,
				},
				{
					backwardWeight: track3.curveTop.backwardWeight,
					center: track3.curveTop.center,
					forward: track3.curveTop.forward,
					forwardWeight: track3.curveTop.forwardWeight,
					trackBank: -45,
				},
				{
					backwardWeight: track3.curveRight.backwardWeight,
					center: track3.curveRight.center,
					forward: track3.curveRight.forward,
					forwardWeight: track3.curveRight.forwardWeight,
					trackBank: -45,
				},
				{
					backwardWeight: track3.curveEnd.backwardWeight,
					center: track3.curveEnd.center,
					forward: track3.curveEnd.forward,
					trackBank: -10,
				},
				jump.runout
			]},
		]},
	});
	tracks.register({
		sibling: track3,
		member: "Using spiral",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track3.curveEnd.center,
							forward: track3.curveEnd.forward,
						},
						rotate: 'right',
					},
					jump.runout
				],
			}],
		},
	});
	tracks.register({
		sibling: track3,
		member: "Using spiral with 23&#176; bank",
		track: {
			segments: [ jump.launchSegment, {
				points: [
					jump.catchStart,
					jump.catchEnd,
					{
						type: 'spiral',
						endsAt: {
							center: track3.curveEnd.center,
							forward: track3.curveEnd.forward,
						},
						rotate: 'right',
						trackBank: parametricBank,
					},
					jump.runout
				],
			}],
		},
	});

	//----------------------------------------------------------------------
	// Loop

	tracks.register({
		family: "Loop",

		_offset: .4,
		_radius: 3,

		init: function() {
			const weight = circleWeight * this._radius;

			this.track = { segments: [ { points: [
				launch.start,
				launch.end,
			]}]};
			let p = this._pushPoint({	// End of slope, start of flat
				center: zero,
				forward: negX,
				backwardWeight: 4,
			});
			p = this._pushPoint({		// Entry into loop
				center: {
					x: p.center.x - this._radius,
					y: p.center.y,
					z: p.center.z
				},
				forward: negX,
				forwardWeight: weight,
			});
			p = this._pushPoint({		// First quarter of loop
				backwardWeight: weight,
				center: {
					x: p.center.x - this._radius,
					y: p.center.y + this._radius,
					z: p.center.z + this._offset,
				},
				forward: posY,
				forwardWeight: weight,
				trackBank: negX,
			});
			p = this._pushPoint({		// Top of loop
				backwardWeight: weight,
				center: {
					x: p.center.x + this._radius,
					y: p.center.y + this._radius,
					z: p.center.z + this._offset
				},
				forward: posX,
				forwardWeight: weight,
				trackBank: posY,
			});
			p = this._pushPoint({		// Last quarter of loop
				backwardWeight: weight,
				center: {
					x: p.center.x + this._radius,
					y: p.center.y - this._radius,
					z: p.center.z + this._offset
				},
				forward: negY,
				forwardWeight: weight,
				trackBank: posX,
			});
			p = this._pushPoint({		// Exit of loop
				backwardWeight: weight,
				center: {
					x: p.center.x - this._radius,
					y: p.center.y - this._radius,
					z: p.center.z + this._offset
				},
				forward: negX,
			});
			this._pushPoint({			// Runout
				type: 'straight',
				length: 2 * this._radius,
			});
		},

		_pushPoint: function(p) {
			this.track.segments[0].points.push(p);
			return p;
		},
	});

	//----------------------------------------------------------------------
	// Flat curves

	const track5 = tracks.register({
		family: "Flat curves",

		heights: [0, 2, 4],
		runoutLength: 1,

		_radius: 4,

		createPoint: function(segment, vertex, forward, weightsToSet) {
			const p = {
				center: {
					x: this._vertices[vertex].x,
					y: this.heights[segment],
					z: this._vertices[vertex].z
				},
				forward: forward
			};
			if (weightsToSet) {
				for (let key of weightsToSet) p[key] = this._weight;
			}
			return p;
		},
		pushPoint: function(segments, segment, vertex, forward, weightsToSet) {
			const p = typeof(vertex) === 'number' ?
				this.createPoint(segment, vertex, forward, weightsToSet) :
				vertex;
			segments[segment].points.push(p);
			return p;
		},

		init: function() {
			this._weight = this._radius * circleWeight;

			this._vertices = [];
			let v = this._pushVertex(this._radius, -this.runoutLength);
			v = this._pushVertex(v.x, v.z + this.runoutLength);
			v = this._pushVertex(v.x - this._radius, v.z + this._radius);
			v = this._pushVertex(v.x - this._radius, v.z - this._radius);
			this._pushVertex(v.x, v.z - this.runoutLength);

			const segments = [ { points: [] }, { points: [] } ];
			this.track = { segments: segments  };

			// Segment 0, left turn
			this.pushPoint(segments, 0, 0, posZ);
			this.pushPoint(segments, 0, 1, posZ, ['forwardWeight']);
			this.pushPoint(segments, 0, 2, negX, ['backwardWeight', 'forwardWeight']);
			this.pushPoint(segments, 0, 3, negZ, ['backwardWeight']);
			this.pushPoint(segments, 0, 4, negZ);

			// Segment 1, right turn
			this.pushPoint(segments, 1, 4, posZ);
			this.pushPoint(segments, 1, 3, posZ, ['forwardWeight']);
			this.pushPoint(segments, 1, 2, posX, ['backwardWeight', 'forwardWeight']);
			this.pushPoint(segments, 1, 1, negZ, ['backwardWeight']);
			this.pushPoint(segments, 1, 0, negZ);
		},

		_pushVertex: function(x, z) {
			const v = { x: x, z: z };
			this._vertices.push(v);
			return v;
		},
	});
	tracks.register({
		sibling: track5,
		member: "With spirals",

		init: function() {

			const runout = { type: 'straight', length: track5.runoutLength };

			const segments = [ track5.track.segments[0], { points: [] }, { points: [] } ];
			this.track = { segments: segments }

			// Segment 1, left spiral
			track5.pushPoint(segments, 1, 0, posZ);
			track5.pushPoint(segments, 1, runout);
			track5.pushPoint(segments, 1, {
				type: 'spiral',
				endsAt: track5.createPoint(1, 3, negZ),
				rotate: 'left',
			});
			track5.pushPoint(segments, 1, runout);

			// Segment 2, right spiral
			track5.pushPoint(segments, 2, 4, posZ);
			track5.pushPoint(segments, 2, runout);
			track5.pushPoint(segments, 2, {
				type: 'spiral',
				endsAt: track5.createPoint(2, 1, negZ),
				rotate: 'right',
			});
			track5.pushPoint(segments, 2, runout);
		},
	});

	//----------------------------------------------------------------------
	// Helixes

	const track6 = tracks.register({
		family: 'Helix',
		member: 'Left 360&#176; 4 turns (alt -.1)',
		track: {
			segments: [
				{
					points: [
						{
							type: 'spiral',
							startsAt: {
								center: { x: 0, y: 10, z: 0, },
								forward: posX,
							},
							endsAt: {
								center: zero,
								forward: posX,
							},
							rotate: 'left',
							turns: 4,
							center: { x:0, y:0, z:4 },
						},
					],
				}
			],
			debug: true,
			altDeclination: -.1,
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 360&#176; 1 turn (cheat -0.06)',
		track: {
			segments: [
				{
					points: [
						{
							type: 'spiral',
							startsAt: {
								center: { x: 0, y: 2, z: 0, },
								forward: posX,
							},
							endsAt: {
								center: zero,
								forward: posX,
							},
							rotate: 'left',
							turns: 1,
							center: { x:0, y:0, z:4 },
						},
					],
				}
			],
			debug: true,
			altDeclination: -0.06,
		},
	});
	const track6r = tracks.register({
		sibling: track6,
		member: 'Right 360&#176; 4 turns',
		init() {
			const p = track6.track.segments[0].points[0];
			this.track = { segments: [ { points: [
				{
					type: 'spiral',
					startsAt: p.startsAt,
					endsAt: p.endsAt,
					rotate: 'right',
					turns: p.turns,
					center: {
						x:-p.center.x,
						y:-p.center.y,
						z:-p.center.z
					},
				}
			]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 360&#176; 4 turns, 12 high',
		init() {
			const p = track6r.track.segments[0].points[0];
			this.track = { segments: [ { points: [
				{
					type: 'spiral',
					startsAt: {
						center: {x: p.startsAt.center.x, y: p.startsAt.center.y + 2, z: p.startsAt.center.z},
						forward: p.startsAt.forward
					},
					endsAt: p.endsAt,
					rotate: p.rotate,
					turns: p.turns,
					center: p.center,
				}
			]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 360&#176; 4 turns up',
		init() {
			const p = track6.track.segments[0].points[0];
			this.track = { segments: [ { points: [
				{
					type: 'spiral',
					startsAt: p.endsAt,
					endsAt: p.startsAt,
					rotate: p.rotate,
					turns: p.turns,
					center: p.center,
				}
			]}],};
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 90&#176; 6 turns',
		track: { segments: [ { points: [
			{
				type: 'spiral',
				startsAt: {
					center: { x: 4, y: 10, z: 0, },
					forward: posZ,
				},
				endsAt: {
					center: { x: 0, y: 0, z: 4, },
					forward: negX,
				},
				rotate: 'left',
				turns: 6,
			}
		]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 180&#176; 6 turns',
		track: { segments: [ { points: [
			{
				type: 'spiral',
				startsAt: {
					center: { x: -4, y: 10, z: 0, },
					forward: posZ,
				},
				endsAt: {
					center: { x: 4, y: 0, z: 0, },
					forward: negZ,
				},
				rotate: 'right',
				turns: 6,
			}
		]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Left 270&#176; 6 turns',
		track: { segments: [ { points: [
			{
				type: 'spiral',
				startsAt: {
					center: { x: 4, y: 10, z: 0, },
					forward: posZ,
				},
				endsAt: {
					center: { x: 0, y: 0, z: -4, },
					forward: posX,
				},
				rotate: 'left',
				turns: 6,
			}
		]}],},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 315&#176; 6 turns (a)',
		track: {
			segments: [{
				points: [{
					type: 'spiral',
					startsAt: {
						center: { x: -4, y: 10, z: 0, },
						forward: posZ,
					},
					endsAt: {
						forward: { x: -1, y: 0, z: 1 },
					},
					rotate: 'right',
					turns: 6,
				}]
			}],
			debug:true,
		},
		init() {
			const theta = (180 + 45) * Math.PI / 180;
			const p = this.track.segments[0].points[0];
			p.endsAt.center = { x: 4 * Math.cos(theta), y: 0, z: 4 * Math.sin(theta) };
		},
	});
	tracks.register({
		sibling: track6,
		member: 'Right 315&#176; 6 turns (b)',
		track: {
			segments: [{
				points: [
					{
						type: 'spiral',
						startsAt: {
							center: { x: -4, y: 10, z: 0, },
							forward: posZ,
						},
						rotate: 'right',
						turns: 6,
					},
					{
						type: 'spiral',
						endsAt: {
							forward: { x: -1, y: 0, z: 1 },
						},
						rotate: 'right',
					},
				]
			}],
			debug:true,
		},
		init() {
			const radius = 4;

			const p0 = this.track.segments[0].points[0];
			const p1 = this.track.segments[0].points[1];

			const wholeSweep = 315 + 360 * p0.turns;
			const p1Sweep = 90;
			const descent = p1Sweep / wholeSweep;

			const theta0 = -45 * Math.PI / 180;
			const radial0 = { x: Math.cos(theta0), y: 0, z: Math.sin(theta0) }
			p0.endsAt = {
				center: { x: radius * radial0.x, y: descent * p0.startsAt.center.y, z: radius * radial0.z },
				forward: { x: -1, y: -1 / wholeSweep, z: -1},
			}

			const theta1 = -135 * Math.PI / 180;
			p1.endsAt.center = { x: radius * Math.cos(theta1), y: 0, z: radius * Math.sin(theta1) };
		},
	});
}

//======================================================================
// WINDOW INITIALIZATION

window.initFunction = async function() {

	// Hook DOM elements
	errorDisplay.init("track-error", "track-error-text", [ "go" ]);
	try {
		declinationDisplay.init("ThisIsMe", ".declination", "altDeclination");
		debugDisplay.init(['debugGeneral', 'debugSegments']);
		babylon.setCanvas("renderCanvas");
		tracks.setSelectors("trackFamilies", "trackMembers");
		ball.setButton("go");
	} catch (e) {
		errorDisplay.show(e);
		throw e;
	}

	const asyncEngineCreation = async function() {
		try {
			return babylon.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return babylon.createDefaultEngine();
		}
	}

	window.engine = await asyncEngineCreation();
	if (!babylon._engine) throw 'engine should not be null.';

	await ammo.bind(window)();

	babylon.startRenderLoop();
	window.scene = babylon.createScene();

	// Get tracks
	try {
		defineTracks();
		tracks.start();
	} catch (e) {
		errorDisplay.show(e);
	}
};
initFunction().then(() => { babylon.ready() });
window.addEventListener("resize", babylon.resize());
