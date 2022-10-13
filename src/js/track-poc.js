const defaultSettings = {
	precision: .01,
	trackBank: 0,
	trackWidth: 1,
	wallHeight: .5,
};

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

	integer: function isInteger(value) {
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
		if (isInteger(value) && value >= 0) return value;
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
		if (is.number(value)) {
			let v = value % 360;
			if (v > 180) v -= 360;
			if (v <= -180) v += 360;
			return v;
		}
		throw new TypeError(`${objectName}.${memberName} must be a number or 3D vector`);
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

	_resolveName: function(objectName, memberName) {
		return memberName.length === 0 ? objectName : (objectName + '.' + memberName);
	},
}

const mergeSettings = {
	merge: function(masterSettings, overrideSettings, name) {
		const mergedSettings = {...masterSettings};
		for (let vs of this._valid) {
			if (is.defined(overrideSettings[vs.key])) {
				mergedSettings[vs.key] = vs.validator(overrideSettings, vs.key, name);
			}
		}
		return mergedSettings;
	},

	_valid: [
		{ key: 'precision', validator: validate.positiveNumber },
		{ key: 'trackBank', validator: validate.trackBank, },
		{ key: 'trackWidth', validator: validate.positiveNumber },
		{ key: 'wallHeight', validator: validate.positiveNumber },
	],
}

const vector = {

	angleToRadians: Math.PI / 180,

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
		const theta = angle * vector.angleToRadians;
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

	zero: { x:0, y:0, z:0 },
};

const plane = {
	
	_defaultTolerance: 0.9,
	
	contains: function(plane, vertex, tolerance) {
		if (!is.defined(tolerance)) tolerance = this._defaultTolerance;
		const toVertex = vector.add(vertex, -1, plane.origin);
		return Math.abs(vector.dot(plane.normal, toVertex)) < (1 - tolerance);
	},
	
	create: function(origin, normal) {
		return {
			origin: origin,
			normal: vector.normalize(normal),
		};
	},
	
	isParallel: function(a, b, tolerance) {
		if (!is.defined(tolerance)) tolerance = this._defaultTolerance;
		return Math.abs(vector.dot(a.normal, b.normal)) >= tolerance;
	},
	
	isSame: function(a, b, tolerance) {
		return this.isParallel(a, b, tolerance) && this.contains(a, b.origin, tolerance);
	},
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

	parse: function(builders, points, rawPoint, masterSettings, name) {
		const point = this.validate(rawPoint, masterSettings, name);
		points.push(point);
		if (points.length > 1) builders.push(createBuilder(masterSettings));
	},
	
	validate: function(rawPoint, masterSettings, name) {

		// The raw point cannot have a 'precision' element
		if (is.defined(rawPoint.precision)) {
			throw new TypeError(`${name} cannot define precision`);
		}

		// Create the point with its settings and name
		const point = mergeSettings.merge(masterSettings, rawPoint, name);
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

	parse: function(builders, points, rawSpiral, masterSettings, name) {
		const specs = this._getSpecs(points, rawSpiral, masterSettings, name);
		this._generate(builders, points, specs, masterSettings);
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

	_getSpecs: function(points, rawSpiral, masterSettings, name) {

		// Create the base spiral specification
		const settings = mergeSettings.merge(masterSettings, rawSpiral, name);

		// Get either the entry point or the overrideFirstWeight option
		if (points.length === 0) {
			settings.startsAt = pointParser.validate(rawSpiral['startsAt'], settings, name + '.startsAt');
		} else {
			if (is.defined(rawSpiral.startsAt)) {
				throw new RangeError(`${name}.startsAt cannot be specified for a spiral that does not start a segment`);
			}
			settings.startsAt = points[points.length - 1];
		}

		// Get the number of turns
		const turns = validate.nonNegativeInteger(rawSpiral, 'turns', name, 0);

		// Get the rotation
		const rotate = validate.string(rawSpiral, 'rotate', name);
		if (rotate !== 'left' && rotate !== 'right' && rotate !== 'up') {
			throw new RangeError(`${name}.rotate must be either 'left', 'right', or 'up'.`);
		}
		
		// Get the endsAt
		settings.endsAt = pointParser.validate(rawSpiral['endsAt'], settings, name + '.endsAt');
		
		// Determine the rotation plane.
		settings.rotationPlane = this._getRotationPlane(settings, rotate, rawSpiral, name);

		// Now that we have the rotation plane, we can compute the angles,
		// altitudes, and radii
		throw 'Not implemented, need to determine the entry/exit angle, altitude and radius';

		// Set the interpolation functions
		settings.altitude = setInterpolation(startAltitude, endAltitude);
		settings.angle = setInterpolation(startAngle, endAngle + 360 * turns);
		settings.radius = this.setInterpolation(startRadius, endRadius);

		// Return the specifications
		return settings;
	},
	
	_getRotationPlane: function(settings, rotate, rawSpiral, name) {
		const entryPlane = plane.create(settings.startsAt.center, settings.startsAt.forward);
		const exitPlane = plane.create(settings.endsAt.center, settings.endsAt.forward);
		if (plane.isSame(entryPlane, exitPlane)) {
			throw '_getRotationPlane: not implemented, identical entry and exit planes';
		} else if (plane.isParallel(entryPlane, exitPlane)) {
			//const center = validate.vector3(rawSpiral, 'center', name);
			//if (rotate === 'left') {
			//	throw '_getRotationPlane: make sure centernot implemented, parallel entry and exit planes';
			//} else if (rotate === 'right') {
			//} else {
			//}
			throw '_getRotationPlane: not implemented, parallel entry and exit planes';
		} else {
			// 'center' is illegal
			validate.undefined(rawSpiral, 'center', name);
			throw '_getRotationPlane: not implemented, intersecting entry and exit planes';
		}
	},

	_setInterpolation: function(t0, t1) {
		const delta = t1 - t0;
		return Math.abs(delta) < .001 ?
			(t) => { return t0; } :
			(t) => { return t0 + t * delta; };
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

	_generate: function(builders, points, settings, masterSettings) {

		// Insert the entry point if this is the first point of the segment.
		// Otherwise patch its forwardWeight if required.
		if (points.length === 0) {
			points.push(settings.startsAt);
		} else if (settings.overrideFirstWeight) {
			points[points.length - 1].forwardWeight = settings.entryRadius * circleWeight;
		}

		// Add the 90° sections
		for (let angle = 0; angle < settings.sweep; angle += 90) {
			this.generateSection(builders, points, angle, settings);
		}

		// Patch the forward weight of the last point
		points[points.length - 1].forwardWeight = settings.forwardWeight;
	},

	_generateSection: function(builders, points, angle, settings) {
		throw "Not implemented";
	},
}

const straightParser = {

	parse: function(builders, points, rawStraight, masterSettings, name) {

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
		const endPoint = mergeSettings.merge(masterSettings, rawStraight, name);
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
			startPoint = mergeSettings.merge(masterSettings, rawStraight, name);
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
		builders.push(createBuilder(masterSettings));
	}
}

const sectionParser = {

	parse: function(builders, points, rawPoint, masterSettings, name) {

		// The raw point must be an object
		validate.object(rawPoint, name);

		// Check the type
		const sectionType = is.defined(rawPoint.type) ? rawPoint.type : 'point';
		const sectionParser = this._parsers[sectionType];
		if (!is.defined(sectionParser)) {
			throw new TypeError(`${name}.type of '${sectionType}' is not recognized`);
		}

		// Parse the section
		sectionParser.parse(builders, points, rawPoint, masterSettings, name);
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

function buildSegment(segment, vectorFactory, masterSettings, isClosed, name) {

	// Segment must be an object
	validate.object(segment, name);

	// Create settings
	const settings = mergeSettings.merge(masterSettings, segment, name);

	// Make sure that 'points' is an array with at least one element
	validate.sizedArray(segment, 'points', name, 1);

	// Reform the points array into two arrays of n section builders and
	// n+1 segment points
	const builders = [];
	const points = [];
	for (let i = 0; i < segment.points.length; i++) {
		sectionParser.parse(builders, points, segment.points[i], settings, `${name}.points[${i}]`);
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

function buildTrack(track, vectorFactory, masterSettings) {

	// Create settings
	const settings = mergeSettings.merge(masterSettings, track, 'track');

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

//==========================================================================
// API

// specs			a specification object or a json serialization of a
//					specification object
// vectorFactory	function to build an application friendly 3D vector,
//					v = vectorFactory(u) where u has keys x, y, z.
// settings			application settings for the build

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
		const settings = mergeSettings.merge(defaultSettings, appSettings, 'appSettings');

		// Build the ribbons
		return buildTrack(objSpecs, vectorFactory, settings);
	},

	vector: {
		direction: function(from, to) {
			return vector.normalize(vector.difference(from, to));
		}
	},
}
