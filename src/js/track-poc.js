
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

	constructor(dimension) {
		this.coordinates = []
		if (is.integer(dimension)) {
			for (let i = 0; i < dimension; i++) this.coordinates[i] = 0;
		} else {
			for (let i = 0; i < dimension.length; i++) this.coordinates[i] = dimension[i];
		}
	}

	get dimension() { if (this.debug) console.log('Vector.getDimension(%o)', this, k, v); return this.coordinates.length; }

	add(k, v) {
		if (this.debug) console.log('Vector.add(%o, %f, %o)', this, k, v);
		return this.#makeVector((i) => this.coordinates[i] + k * v.coordinates[i])
	}
	dot(v) {
		if (this.debug) console.log('Vector.dot(%o)', this);
		return this.#makeSum((i) => this.coordinates[i] * v.coordinates[i]);
	}
	interpolate(v, t) {
		if (this.debug) console.log('Vector.interpolate(%o, %o, %f)', this, v, t);
		const olt = 1 - t;
		return this.#makeVector((i) => olt * this.coordinates[i] + t * v.coordinates[i])
	}
	length() {
		if (this.debug) console.log('Vector.length(%o)', this);
		return Math.sqrt(this.#makeSum((i) => this.coordinates[i] * this.coordinates[i]));
	}
	midpoint(v) {
		if (this.debug) console.log('Vector.midpoint(%o, %o)', this, v);
		return this.#makeVector((i) => (this.coordinates[i] + v.coordinates[i]) / 2)
	}
	newHack() {
		throw new InternalError('Vector.newHack must be overridden')
	}
	normalize() {
		if (this.debug) console.log('Vector.normalize(%o)', this);
		const length = this.length();
		return this.#makeVector((i) => this.coordinates[i] / length);
	}
	scale(k) {
		if (this.debug) console.log('Vector.scale(%o, %f)', this, k);
		return this.#makeVector((i) => k * this.coordinates[i])
	}
	to(v) {
		if (this.debug) console.log('Vector.to(%o, %o)', this, v);
		return this.#makeVector((i) => v.coordinates[i] - this.coordinates[i])
	}
	toNormal(v) {
		if (this.debug) console.log('Vector.toNormal(%o, %o)', this, v);
		return this.to(v).normalize();
	}

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

	get x() { if (this.debug) console.log('Vector3.getx(%o)', this); return this.coordinates[0] }
	get y() { if (this.debug) console.log('Vector3.gety(%o)', this); return this.coordinates[1] }
	get z() { if (this.debug) console.log('Vector3.getz(%o)', this); return this.coordinates[2] }

	static get backward() { return Vector3.#backward }
	static get down() { return Vector3.#down }
	static get forward() { return Vector3.#forward }
	static get left() { return Vector3.#left }
	static get right() { return Vector3.#right }
	static get up() { return Vector3.#up }
	static get zero() { return Vector3.#zero }

	cross(v) {
		if (this.debug) console.log('Vector3.cross(%o, %o)', this, v);
		return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
	}
	newHack() { return new Vector3() }
	rotate(axis, angle) {
		if (!(axis instanceof Vector3)) throw new Error('Vector3.rotate: axis is not a Vector3');
		if (!is.number(angle)) throw new Error('Vector3.rotate: angle is not a number');
		if (this.debug) console.log('Vector3.rotate(%o, %o, %f)', this, axis, angle);
		const theta = angle * trig.degreesToRadians;
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		return this.scale(cos).add(sin, axis.cross(this)).add(this.dot(axis) * (1 - cos), axis);
	}
}

const vector = {
	add: function(u, k, v) {
		return {
			x: u.x + k * v.x,
			y: u.y + k * v.y,
			z: u.z + k * v.z,
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
	normalize: function(u) {
		const length = vector.length(u);
		return {
			x: u.x / length,
			y: u.y / length,
			z: u.z / length,
		};
	},
	to: function(from, to) { return this.normalize(this.difference(from, to)) },
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

		// Get the line direction. Normalize should throw an error if the
		// planes are parallel
		if (!(other instanceof Plane)) throw new Error('Plane.getIntersection: other is not a Plane');
		const direction = this.#normal.cross(other.#normal).normalize();

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
	getHelixAt(cylPoint, declination, debug) {
		if (!is.defined(this.#xAxis)) this.#setDefaultAxes();

		const theta = cylPoint.angle * trig.degreesToRadians;
		const cos = trig.clampAt0And1(Math.cos(theta));
		const sin = trig.clampAt0And1(Math.sin(theta));

		if (!(this.#xAxis instanceof Vector3)) throw new Error('Plane.getHelixAt: #xAxis is not a Vector3');
		if (!(this.#yAxis instanceof Vector3)) throw new Error('Plane.getHelixAt: #yAxis is not a Vector3');
		const radial = this.#xAxis.scale(cos).add(sin, this.#yAxis);
		const point = vector.add(vector.add(this.#origin, cylPoint.radius, radial), cylPoint.height, this.#normal);
		const newPoint = this.#origin.add(cylPoint.radius, radial).add(cylPoint.height, this.#normal);
		if (point.x !== newPoint.x || point.y !== newPoint.y || point.z !== newPoint.z) throw Error('Plane.getHelixAt: point not computed');
		let forward = this.#xAxis.scale(-sin).add(cos, this.#yAxis);
		if (debug) console.log('Plane.getHelixAt: declination %f, forward %o', declination, forward);
		if (Math.abs(declination) > 0.01) {
			forward = forward.rotate(radial, declination);
			if (debug) console.log('Plane.getHelixAt: after forward %o', forward);
		}

		return {
			point: newPoint,
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
		if (!(xAxis instanceof Vector3)) throw new Error('Plane.setAxes: xAxis is not a Vector3');
		this.#xAxis = xAxis.add(-xAxis.dot(this.#normal), this.#normal).normalize();
		this.#yAxis = this.#xAxis.cross(this.#normal);
	}

	#getHeight(vertex) {
		return this.#getHeightTo(this.#toVertex(vertex));
	}
	#getHeightTo(toVertex) {
		return vector.dot(this.#normal, toVertex);
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
		return vector.add(vertex, -1, this.#origin);
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
		const forward = new Vector3(sp.forward);
		console.log('bezier._getDown: sp.forward %o, new %o', sp.forward, forward);
		const dot = forward.dot(down);
		if (Math.abs(dot) > .0001)  {
			down = down.add(-dot, forward);
		}

		// Rotate the down vector if there is banking
		if (Math.abs(sp.trackBank) > .0001) {
			console.log('bezier._getDown: rotating');
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
	points' polar coordinates.

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
		if (specs.debug) {
			console.log('spiralParser._getSpecs: deltaAltitude %f, sweep %f, declination %f', deltaAltitude, sweep, declination);
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
		else throw new Error('spiralParser._getSpecs: trackBankMultiplier not implemented');

		// Return the specifications
		console.log('spiralParser._getSpecs: startsAt.forward %o, endsAt.forward %o', specs.startsAt.forward, specs.endsAt.forward);
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
		if (rotate === 'left' || rotate === 'right') return Vector3.up;
		throw new Error('_getRotationAxis: not implemented for non-up axis');
	},

	_getRotationPlane: function(specs, rotate, rawSpiral, name) {

		// Get the entry and exit planes
		if (!(specs.startsAt.center instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: specs.startsAt.center is not a Vector3');
		if (!(specs.startsAt.forward instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: specs.startsAt.forward is not a Vector3');
		if (!(specs.endsAt.center instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: specs.endsAt.center is not a Vector3');
		if (!(specs.endsAt.forward instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: specs.endsAt.forward is not a Vector3');
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
					if (!(center instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: center is not a Vector3');
					const isAboveBelow = function(plane, point) {
						if (!(plane instanceof Plane)) throw new Error('spiralParser._getRotationPlane.isAboveBelow: plane is not a Plane');
						if (!(point instanceof Vector3)) throw new Error('spiralParser._getRotationPlane.isAboveBelow: point is not a Vector3');
						const oldplaneUp = vector.normalize(vector.add(Vector3.up, -vector.dot(Vector3.up, plane.normal), plane.normal));
						const planeUp = Vector3.up.add(-Vector3.up.dot(plane.normal), plane.normal).normalize();
						if (oldplaneUp.x !== planeUp.x || oldplaneUp.y !== planeUp.y || oldplaneUp.z !== planeUp.z) throw new Error('spiralParser._getRotationPlane.isAboveBelow: error computing planeUp');
						if (!(planeUp instanceof Vector3)) throw new Error('spiralParser._getRotationPlane.isAboveBelow: planeUp is not a Vector3');
						const oldtoPoint = vector.to(plane.origin, point);
						const toPoint = plane.origin.toNormal(point);
						if (oldtoPoint.x !== toPoint.x || oldtoPoint.y !== toPoint.y || oldtoPoint.z !== toPoint.z) throw new Error('spiralParser._getRotationPlane.isAboveBelow: error computing toPoint');
						if (!(toPoint instanceof Vector3)) throw new Error('spiralParser._getRotationPlane.isAboveBelow: toPoint is not a Vector3');
						const oldd = vector.dot(planeUp, toPoint);
						const d = planeUp.dot(toPoint);
						if (oldd !== d) throw new Error('spiralParser._getRotationPlane.isAboveBelow: error computing d');
						return Math.abs(d) > .95;
					}
					if (isAboveBelow(entryPlane, center)) {
						throw new Error(`${name}: center and entry points are too close vertically; center must have some offset`);
					}
					if (isAboveBelow(exitPlane, center)) {
						throw new Error(`${name}: center and exit points are too close vertically; center must have some offset`);
					}
					rotCenter = center;
					if (!(rotCenter instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotCenter is not a Vector3');
					rotAxis = this._getRotationAxis(specs, rotate);
					if (!(rotAxis instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotAxis is not a Vector3');
				} else {
					throw new Error('_getRotationPlane: not implemented, center, rotate up identical entry and exit planes');
				}
			} else if (rotate === 'left' || rotate === 'right') {
				const oldtoEnd = vector.to(entryPlane.origin, exitPlane.origin);
				const toEnd = entryPlane.origin.toNormal(exitPlane.origin);
				if (oldtoEnd.x !== toEnd.x || oldtoEnd.y !== toEnd.y || oldtoEnd.z !== toEnd.z) {
					console.log('spiralParser._getRotationPlane: error calculating toEnd %o, expecting %o', toEnd, oldtoEnd);
					throw new Error('spiralParser._getRotationPlane: error calculating toEnd');
				}
				if (!(toEnd instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: toEnd is not a Vector3');
				const d = vector.dot(Vector3.up, toEnd);
				if (Math.abs(d) >= .9) {
					throw new Error(`${name}: starting and ending points are too close vertically; center required`);
				}
				const oldrotCenter = vector.midpoint(entryPlane.origin, exitPlane.origin);
				rotCenter = entryPlane.origin.midpoint(exitPlane.origin);
				if (oldrotCenter.x !== rotCenter.x || oldrotCenter.y !== rotCenter.y || oldrotCenter.z !== rotCenter.z) {
					console.log('spiralParser._getRotationPlane: error calculating rotCenter %o, expecting %o', rotCenter, oldrotCenter);
					throw new Error('spiralParser._getRotationPlane: error calculating rotCenter');
				}
				if (!(rotCenter instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotCenter is not a Vector3');
				rotAxis = this._getRotationAxis(specs, rotate);
				if (!(rotAxis instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotAxis is not a Vector3');
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
			validate.undefined(rawSpiral, 'center', name);

			// Get intersection of the planes, a line, and use this as
			// the rotation center and axis
			const line = entryPlane.getIntersection(exitPlane);
			rotCenter = line.origin;
			if (!(rotCenter instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotCenter is not a Vector3');
			rotAxis = line.normal;
			if (!(rotAxis instanceof Vector3)) throw new Error('spiralParser._getRotationPlane: rotAxis is not a Vector3');
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
			throw new Error('_setSweep: need to compute sweep up');
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

		console.log('bezier._addPoint: rotation plane %o', specs.rotationPlane);
		const polar = specs.rotationPlane.getHelixAt(cylPoint, declination, specs.debug);

		const pointName = `${name}@${cylPoint.angle}`;
		const point = merge.settings(parentSettings, rawSpiral, pointName);
		point.backwardWeight = cylPoint.radius * this._circleWeight;
		point.center = polar.point;
		point.forward = polar.forward;
		console.log('spiralParser._addPoint: old forward %o, new forward %o', polar.forward, new Vector3(polar.forward));
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
		console.log('sectionParser: using ' + sectionType);
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
}
