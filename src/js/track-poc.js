//==============================================================================
// HELPER ROUTINES

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

//==============================================================================
// RIBBON MANAGEMENT

// A ribbon is an array of four arrays of vectors representing the [0] left wall
// top, [1] left road edge, [2] right road edge, and [3] right wall top.

function addRibbonSlice(ribbon, bp, vectorFactory) {
	const left = vector.cross(bp.forward, bp.down);
	const wall = vector.multiply(-bp.wallHeight, bp.down);
	const edgeDistance = bp.trackWidth / 2;
	const leftEdge = vector.add(bp.center, edgeDistance, left);
	const rightEdge = vector.add(bp.center, -edgeDistance, left);
	ribbon[0].push(vectorFactory(vector.add(leftEdge, 1, wall)));
	ribbon[1].push(vectorFactory(leftEdge));
	ribbon[2].push(vectorFactory(rightEdge));
	ribbon[3].push(vectorFactory(vector.add(rightEdge, 1, wall)));
}

function createRibbon() {
	return [ [], [], [], [] ];
}

//==============================================================================
// BEZIER CURVE BUILDER

function buildCurve(ribbon, sp0, sp1, vectorFactory, precision) {

	// Compute the Bezier cubic curve points
	const curve = {
		points: [
			sp0.center,
			vector.add(sp0.center, sp0.forwardWeight, sp0.forward),
			vector.add(sp1.center, -sp1.backwardWeight, sp1.forward),
			sp1.center,
		],
		trackBanks: [ getSegmentPointDownVector(sp0), getSegmentPointDownVector(sp1) ],
		trackWidths: [ sp0.trackWidth, sp1.trackWidth ],
		wallHeights: [ sp0.wallHeight, sp1.wallHeight ],
	}

	// Fill out the curve
	const bpt0 = getBezierPoint(curve, 0);
	const bpt1 = getBezierPoint(curve, 1);
	interpolateCurve(ribbon, curve, 0, 1, bpt0, bpt1, vectorFactory, precision);

	// Return the points array
	return bpt1;
}

function getBezierPoint(curve, t) {
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
}

function getSegmentPointDownVector(sp) {

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
}

// Generate the Bezier cubic curve between t0 and t1
function interpolateCurve(ribbon, curve, t0, t1, bpt0, bpt1, vectorFactory, precision) {

	// NOTE: A cubic Bezier curve generates points, or slices in our case,
	// p0, ..., pn where p0 is the point at t0 and pn is the point at t1.
	// However, for consecutive curves c and d, the last point of c is the
	// same as the first point of d. To avoid duplication of points in the
	// ribbon, this routine only adds points p0, ..., pn-1. Note that same
	// holds for contiguous sections of a curve.

	// Calculate the linear and curve midpoints of the current subsection
	const midtime = (t0 + t1) / 2;
	const lmp = vector.midpoint(bpt0.center, bpt1.center);	// Linear midpoint
	const bmp = getBezierPoint(curve, midtime);				// Bezier midpoint

	// TODO: This precision test is insufficient. It is possible for the curve to pass
	// through the linear midpoint but the tangent at the midpoint be different (e.g.,
	// an 'S' curve passing through the midpoint).

	// If the linear midpoint is close enough to the curve midpoint, add bmp0
	// to the  ribbon. Otherwise recursively add the sections of the curve
	// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
	// the midpoint calcuated here.
	if (vector.distance(lmp, bmp.center) <= precision) {
		addRibbonSlice(ribbon, bpt0, vectorFactory);
	} else {
		interpolateCurve(ribbon, curve, t0, midtime, bpt0, bmp, vectorFactory, precision);
		interpolateCurve(ribbon, curve, midtime, t1, bmp, bpt1, vectorFactory, precision);
	}
}

//==============================================================================
// SEGMENT BUILDER

function buildSegment(segment, vectorFactory, masterSettings, isClosed, nameStr) {

	// Segment must be an object
	validate.object(segment, nameStr);

	// Create settings
	const settings = mergeSettings.merge(masterSettings, segment, nameStr);

	// Make sure that 'points' is an array with at least one element
	validate.sizedArray(segment, 'points', nameStr, 1);

	// Reform the points array into two arrays of n section builders and
	// n+1 segment points
	const builders = [];
	const points = [];
	for (let i = 0; i < segment.points.length; i++) {
		parseSection(builders, points, segment.points[i], settings, `${nameStr}.points[${i}]`);
	}

	// Ensure we have at least one builder and two segment points
	validate.sizedArray(points, '', nameStr, 2);

	// Loop through the builders, creating curves between them
	const ribbon = createRibbon();
	let lastPoint = null;
	for (let i = 0; i < builders.length; i++) {
		lastPoint = executeBuilder(builders[i], ribbon, points[i], points[i+1], vectorFactory);
	}

	// If this is not a closed segment, add the last point to the ribbon
	if (!isClosed) {
		addRibbonSlice(ribbon, lastPoint, vectorFactory, settings);
	}

	return ribbon;
}

const sectionParsers = {
	point: parsePoint,
	spiral: parseSpiral,
	straight: parseStraight,
};

function parseSection(builders, points, rawPoint, masterSettings, nameStr) {

	// The raw point must be an object
	validate.object(rawPoint, nameStr);

	// Check the type
	const sectionType = is.defined(rawPoint.type) ? rawPoint.type : 'point';
	const sectionParser = sectionParsers[sectionType];
	if (!is.defined(sectionParser)) {
		throw new TypeError(`${nameStr}.type of '${sectionType}' is not recognized`);
	}

	// Parse the section
	sectionParser(builders, points, rawPoint, masterSettings, nameStr);
}

function parsePoint(builders, points, rawPoint, masterSettings, nameStr) {

	// The raw point cannot have a 'precision' element
	if (is.defined(rawPoint.precision)) {
		throw new TypeError(`${nameStr} cannot define precision`);
	}

	// Create the point with its settings and name
	const segmentPoint = mergeSettings.merge(masterSettings, rawPoint, nameStr);
	segmentPoint.name = nameStr;

	// The raw point must have a center object with x, y, and z numeric
	// elements
	segmentPoint.center = validate.vector3(rawPoint, 'center', nameStr);

	// If the raw point has a 'forward' vector, validate that. Otherwise
	// use the vector (1, 0, 0)
	if (rawPoint.forward == null) {
		segmentPoint.forward = vector.right;
	} else {
		segmentPoint.forward = validate.vector3(rawPoint, 'forward', nameStr);
	}

	// Get the weights
	segmentPoint.forwardWeight = validate.weight(rawPoint, 'forwardWeight', nameStr);
	segmentPoint.backwardWeight = validate.weight(rawPoint, 'backwardWeight', nameStr);

	// And we are done!
	points.push(segmentPoint);
	if (points.length > 1) builders.push(createBuilder(buildCurve, masterSettings));
}

function getStartsAt(masterSettings, rawSection, nameStr) {
	const startPoint = mergeSettings.merge(masterSettings, rawSection, nameStr);
	startPoint.name = nameStr + '*';
	startPoint.center = validate.vector3(rawSection, 'startsAt', nameStr);
	return startPoint;
}

const spiral = {

	circleWeight: 0.5519150244935105707435627,

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

	parse: function(builders, points, rawSpiral, masterSettings, nameStr) {
		const specs = this.getSpecs(points, rawSpiral, masterSettings, nameStr);
		this.generate(builders, points, specs, masterSettings);
	},

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

	'center' (required)
		This either 'left', 'right', or 'up' and, along with either
		'radius' or 'startRadius', defines the center of rotation that
		is the appropriate radius times the entry point's left, right,
		or up direction vector.
	'endDepth' (required)
		The relative depth of the exit point. This must be a number. This
		requires 'endAngle' as well.
	'endAngle' (required)
		The angle of the exit point.
	'endRadius'
		If specified, sets the radius of the spiral at the exit point.
		This also requires 'startRadius' to be set and renders 'radius'
		illegal.
	'endsAt'
		If specified, sets the exit point of the
		[endDepth, endAngle, endRadius illegal, radius ignored]
	'forwardWeight'
		If specified, applies to the exit point. Note that this does not
		affect the spiral's shape but the shape of the following section.
	'overrideFirstWeight'
		If not specified or is true, resets the entry point's forward weight
		to the weight used by the circular Bezier algorithm. This is illegal
		if the spiral starts the segment.
	'radius'
		If specified, determines the radius of the spiral at both the entry
		and exit points. In this case, the 'startRadius' and 'endRadius'
		settings are illegal.
		If not specified, both 'startRadius' and 'endRadius' are required.
	'startRadius'
		If specified, sets the radius of the spiral at the entry point.
		This also requires 'endRadius' to be set and renders 'radius'
		illegal.
	'startsAt'
		This is required if the spiral starts the track segment. This sets
		the entry point of the spiral in such a case. This is illegal if
		the spiral does not start the segment.
	'turns'
		If specified, this positive integer sets the number of complete
		rotations in the spiral.

	--------------------------------------------------------------------------*/

	getSpecs: function(points, rawSpiral, masterSettings, nameStr) {

		// Create the base spiral specification
		const spiralSpecs = mergeSettings.merge(masterSettings, rawSpiral, nameStr);

		// Get either the entry point or the overrideFirstWeight option
		// *** This satisfies (f) ***
		if (points.length === 0) {
			if (is.defined(rawSpiral.overrideFirstWeight)) {
				throw new RangeError(`${nameStr}.overrideFirstWeight cannot be specified for a spiral that starts a segment`);
			}
			spiralSpecs.startsAt = getStartsAt(masterSettings, rawSpiral, nameStr);
		} else {
			if (is.defined(rawSpiral.startsAt)) {
				throw new RangeError(`${nameStr}.startsAt cannot be specified for a spiral that does not start a segment`);
			}
			spiralSpecs.overrideFirstWeight = validate.boolean(rawSpiral, 'overrideFirstWeight', nameStr, true);
			spiralSpecs.startsAt = points[points.length - 1];
		}

		// Get the number of turns
		// *** This satisfies (e) ***
		const turns = validate.nonNegativeInteger(rawSpiral, 'turns', nameStr, 0);

		// Get the center specification
		// *** This partially satisfies (a) ***
		const center = validate.string(rawSpiral, 'center', nameStr);
		if (center === 'left') {
			throw 'Not implemented, need to set toCenter and spiralSpecs.rotationAxis';
		} else if (center === 'right') {
			throw 'Not implemented, need to set toCenter and spiralSpecs.rotationAxis';
		} else if (center === 'up') {
			throw 'Not implemented, need to set toCenter and spiralSpecs.rotationAxis';
		} else {
			throw new RangeError(`${nameStr}.center must be either 'left', 'right', or 'up'.`);
		}

		// Get the entry radius
		// *** This either completely or partially satisfies (d)
		let startRadius, endRadius;
		if (is.defined(rawSpiral.radius)) {
			validate.undefined(rawSpiral, 'startRadius', nameStr, 'radius');
			validate.undefined(rawSpiral, 'endRadius', nameStr, 'radius');
			startRadius = validate.positiveNumber(rawSpiral, 'radius', nameStr);
			endRadius = startRadius;
		} else if (is.defined(rawSpiral.startRadius)) {
			startRadius = validate.positiveNumber(rawSpiral, 'radius', nameStr);
		} else {
			throw new TypeError(`${nameStr} must specify either 'radius' or 'startRadius'`);
		}

		// Set the rotation center
		// *** This finishes the satisfaction of (a) ***
		sprialSpecs.rotationCenter = vector.add(spiralSpecs.startsAt.center, spiralSpecs.startRadius, toCenter);

		// Now that we have the rotation plane, we can compute the starting
		// altitude and angle
		// *** This partially satisfies (b) and (c) ***
		throw 'Not implemented, need to set starting angle and altitude';

		// Check if the exact exit point is given
		if (is.defined(rawSpiral.endsAt)) {
			// *** This completely satisfies (b), (c), and (d) ***
			throw 'Not implemented, need to parse endsAt and set ending angle, altitude, and radius';

		} else {
			// Otherwise we expect exit altitude and angle to be given and possibly
			// its radius
			// *** This completely satisfies (b), (c), and (d) ***
			throw 'Not implemented, need to parse the ending angle, altitude, and possibly radius';
		}

		// Set the interpolation functions
		spiralSpecs.altitude = setInterpolation(startAltitude, endAltitude);
		spiralSpecs.angle = setInterpolation(startAngle, endAngle + 360 * turns);
		spiralSpecs.radius = this.setInterpolation(startRadius, endRadius);

		// Return the specifications
		return spiralSpecs;
	},

	setInterpolation: function(t0, t1) {
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

	generate: function(builders, points, spiralSpecs, masterSettings) {

		// Insert the entry point if this is the first point of the segment.
		// Otherwise patch its forwardWeight if required.
		if (points.length === 0) {
			points.push(spiralSpecs.startsAt);
		} else if (spiralSpecs.overrideFirstWeight) {
			points[points.length - 1].forwardWeight = spiralSpecs.entryRadius * circleWeight;
		}

		// Add the 90° sections
		for (let angle = 0; angle < spiralSpecs.sweep; angle += 90) {
			this.generateSection(builders, points, angle, spiralSpecs);
		}

		// Patch the forward weight of the last point
		points[points.length - 1].forwardWeight = spiralSpecs.forwardWeight;
	},

	generateSection: function(builders, points, angle, spiralSpecs) {
		throw "Not implemented";
	},
}

function parseSpiral(builders, points, rawStraight, masterSettings, nameStr) {
	spiral.parse(builders, points, rawStraight, masterSettings, nameStr);
}

function parseStraight(builders, points, rawStraight, masterSettings, nameStr) {

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
		throw new TypeError(`${nameStr} must define 'length' or 'endsAt'`);
	}
	if (usesLength && usesEndsAt) {
		throw new TypeError(`${nameStr} cannot define both 'length' and 'endsAt'`);
	}

	// Create the end point with its settings and name
	const endPoint = mergeSettings.merge(masterSettings, rawStraight, nameStr);
	endPoint.name = nameStr;
	if (usesEndsAt) {
		endPoint.center = validate.vector3(rawStraight, 'endsAt', nameStr);
	}

	// Get the starting vertex
	let startPoint;
	const generateStart = points.length === 0;
	if (!generateStart) {
		startPoint = points[points.length - 1];
	} else {
		startPoint = getStartsAt(masterSettings, rawStraight, nameStr);
		startPoint.forwardWeight = validate.weight(rawStraight, 'startingWeight', nameStr);
		if (usesEndsAt) {
			endPoint.forward = vector.normalize(vector.difference(startPoint.center, endPoint.center));
			startPoint.forward = endPoint.forward;
		} else {
			startPoint.forward = validate.vector3(rawStraight, 'forward', nameStr);;
		}
	}

	// Compute the end point's center and forward
	if (usesLength) {
		const length = validate.positiveNumber(rawStraight, 'length', nameStr);
		endPoint.center = vector.add(startPoint.center, length, startPoint.forward);
		endPoint.forward = startPoint.forward;
	} else if (!generateStart) {
		endPoint.forward = vector.normalize(vector.difference(startPoint.center, endPoint.center));
	}

	// Get the weights
	endPoint.forwardWeight = validate.weight(rawStraight, 'forwardWeight', nameStr);
	endPoint.backwardWeight = validate.weight(rawStraight, 'backwardWeight', nameStr);

	// And we are done!
	if (generateStart) points.push(startPoint);
	points.push(endPoint);
	builders.push(createBuilder(buildCurve, masterSettings));
}

function createBuilder(builder, settings) {
	return {
		builder: builder,
		precision: settings.precision
	}
}

function executeBuilder(builder, ribbon, sp0, sp1, vectorFactory) {
	return builder.builder(ribbon, sp0, sp1, vectorFactory, builder.precision);
}

//==============================================================================
// TRACK BUILDER

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
