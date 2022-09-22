const TrackPOC = {}

//==============================================================================
// NOTES
//
// (1)	Any function that takes a 'name' argument treats 'name' as either a
//		function that returns a string or a string. This allows late creation
//		of strings, mainly for the occasional exception. The function
//		'resolveName' handles this resolution of the name.
// (2)	In cases where a string-only name is needed, the argument name is
//		'nameStr'.


//==============================================================================
// HELPER ROUTINES

const coords3 = ['x', 'y', 'z'];

const defaultSettings = {
	precision: .01,
	trackBank: 0,
	trackWidth: 1,
	wallHeight: .5,
};

const validSettings = [
	{ key: 'precision', isPositive: true },
	{ key: 'trackBank', normalizeDegrees: true },
	{ key: 'trackWidth', isPositive: true },
	{ key: 'wallHeight', isPositive: true },
];

function combineNames(prefix, nameStr) {
	return prefix.length == 0 ? nameStr : (prefix + '.' + nameStr);
}

function jsonOrObject(o, name) {
	if (isString(o)) return JSON.parse(o);
	if (isObject(o)) return o;
	throw new TypeError(`${resolveName(name)} must be an JSON string or object`);
}

function mergeSettings(masterSettings, overrideSettings, name) {
	const mergedSettings = {...masterSettings};
	for (let vs of validSettings) {
		const value = overrideSettings[vs.key];
		if (isDefined(value)) {
			mergedSettings[vs.key] = validateValue(resolveName(name), vs, value);
		}
	}
	return mergedSettings;
}

function resolveName(name) {
	return isFunction(name) ? name() : name;
}

//==============================================================================
// TYPE CHECKERS

function isArray(value) {
	return isObject(value) && isInstance(value, 'Array');
}

function isDefault(value) {
	return value === null || value === undefined;
}

function isDefined(value) {
	return value !== null && value !== undefined;
}

function isFunction(value) {
	return typeof(value) === 'function';
}

function isInstance(value, className) {
	return value.constructor.toString().indexOf(className) > -1;
}

function isNumber(value) {
	return typeof(value) === 'number';
}

function isObject(value) {
	return typeof(value) === 'object';
}

function isPositiveNumber(value) {
	return isNumber(value) && value > 0;
}

function isString(value) {
	return typeof(value) === 'string';
}

function isVector(value, coords) {
	if (!isObject(value)) return false;
	for (let coord of coords) {
		if (!isNumber(value[coord])) return false;
	}
	return true;
}

//==============================================================================
// VALIDATORS

function validateObject(value, name) {
	if (isObject(value)) return value;
	throw new TypeError(`${resolveName(name)} must be an object`);
}

function validateSizedArray(value, minElements, name) {
	if (isArray(value)) {
		if (value.length >= minElements) return value;
		throw new RangeError(`${resolveName(name)} must have at least ${minElements} element(s)`);
	}
	throw new TypeError(`${resolveName(name)} must be an Array`);
}

function validateValue(namePrefix, vs, value) {
	if (!isNumber(value)) {
		throw new TypeError(`${combineNames(namePrefix, vs.key)} must be a number`);
	}
	if (vs.isPositive && value <= 0) {
		throw new RangeError(`${combineNames(namePrefix, vs.key)} number be positive`);
	}
	let v = value;
	if (vs.normalizeDegrees) {
		v %= 360;
		if (v > 180) v -= 360;
		if (v <= -180) v += 360;
	}
	return v;
}

function validateVector3(value, name) {
	if (isVector(value, coords3)) return value;
	throw new TypeError(`${resolveName(name)} must be a 3D vector`);
}
	
function validateWeight(value, name) {
	if (isDefault(value)) return 1;
	if (isPositiveNumber(value)) return value;
	throw new RangeError(`${resolveName(name)} must be a positive number`);
}

//==============================================================================
// VECTOR ROUTINES

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

function buildCurve(ribbon, sp0, sp1, vectorFactory, settings) {

	// Compute the Bezier cubic curve points
	const curve = {
		points: [
			sp0.center,
			vector.add(sp0.center, sp0.forwardWeight, sp0.forward),
			vector.add(sp1.center, -sp1.backwardWeight, sp1.forward),
			sp1.center,
		],
		trackBanks: [ sp0.trackBank, sp1.trackBank ],
		trackWidths: [ sp0.trackWidth, sp1.trackWidth ],
		wallHeights: [ sp0.wallHeight, sp1.wallHeight ],
	}
	
	// Fill out the curve
	const bpt0 = getBezierPoint(curve, 0);
	const bpt1 = getBezierPoint(curve, 1);
	interpolateCurve(ribbon, curve, 0, 1, bpt0, bpt1, vectorFactory, settings.precision);
	
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
	
	// TODO: See how much of the down calculation can be moved to
	// addRibbonSlice. In theory, all we need to compute is the banking and
	// not the actual down vector. This saves a bit of time as
	// interpolateCurve computes midpoints for the precision test that it
	// then may not use.
	
	// Compute the down vector. This must be orthogonal to the forward vector.
	// Remove any component of the down vector inline with the forward vector.
	let down = vector.down;
	const dot = vector.dot(forward, down);
	if (dot > .0001) {
		down = vector.normalize(vector.add(down, -dot, forward));
	}
	
	// Compute the banking. If not zero, then rotate the down vector.
	const trackBank = olt * curve.trackBanks[0] + t * curve.trackBanks[1];
	if (Math.abs(trackBank) > .0001) {
		down = vector.rotate(forward, down, trackBank);
	}
	
	return {
		center: center,				// center line position at t
		down: down,					// Down vector at t
		forward: forward,			// Forward vector at t
		trackWidth: trackWidth,
		wallHeight: wallHeight,
	};
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
	validateObject(segment, nameStr);
	
	// Create settings
	const settings = mergeSettings(masterSettings, segment, nameStr);
	
	// Make sure that 'points' is an array with at least two elements
	validateSizedArray(segment.points, 2, () => { return nameStr + '.points' });
	
	// Convert points into internal representations
	const segmentPoints = [];
	for (let i = 0; i < segment.points.length; i++) {
		segmentPoints[i] = constructSegmentPoint(
			segment.points[i],
			settings,
			`${nameStr}.points[${i}]`);
	}
	
	// Loop through the points, creating curves between them
	const ribbon = createRibbon();
	let lastPoint = null;
	for (let i = 1; i < segmentPoints.length; i++) {
		lastPoint = buildCurve(ribbon, segmentPoints[i - 1], segmentPoints[i], vectorFactory, settings);
	}
	
	// If this is not a closed segment, add the last point to the ribbon
	if (!isClosed) {
		addRibbonSlice(ribbon, lastPoint, vectorFactory, settings);
	}
	
	return ribbon;
}
	
function constructSegmentPoint(rawPoint, masterSettings, nameStr) {
	
	// The raw point must be an object
	validateObject(rawPoint, nameStr);
	
	// The raw point cannot have a 'precision' element
	if (isDefined(rawPoint.precision)) {
		throw new TypeError(`${nameStr} cannot define precision`);
	}
	
	// Create the point with its settings and name
	const segmentPoint = mergeSettings(masterSettings, rawPoint, nameStr);
	segmentPoint.name = nameStr;
	
	// The raw point must have a center object with x, y, and z numeric
	// elements
	segmentPoint.center = validateVector3(
		rawPoint.center,
		coords3,
		() => { return nameStr + '.center'; });
	
	// If the raw point has a 'forward' vector, validate that. Otherwise
	// use the vector (1, 0, 0)
	if (rawPoint.forward == null) {
		segmentPoint.forward = {x:1, y:0, z:0};
	} else {
		segmentPoint.forward = validateVector3(
			rawPoint.forward,
			coords3,
			() => { return nameStr + '.forward'; });
	}
	
	// Get the weights
	segmentPoint.forwardWeight = this.validateWeight(
		rawPoint.forwardWeight,
		() => { return nameStr + '.forwardWeight'; });
	segmentPoint.backwardWeight = this.validateWeight(
		rawPoint.backwardWeight,
		() => { return nameStr + '.backwardWeight'; });
		
	// And we are done!
	return segmentPoint;
}

//==============================================================================
// TRACK BUILDER

function buildTrack(track, vectorFactory, masterSettings) {
	
	// Create settings
	const settings = mergeSettings(masterSettings, track, 'track');
	
	// Make sure that 'segments' is an array with at least one element
	validateSizedArray(track.segments, 1, 'track.segments'); 
	
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

TrackPOC.build = function(specs, vectorFactory, appSettings = {}) {
	
	// Validate the arguments
	const objSpecs = jsonOrObject(specs, 'specs');
	if (!isFunction(vectorFactory)) {
		throw new TypeError('vectorFactory must be a function');
	}
	if (!isObject(appSettings)) {
		throw new TypeError('appSettings must be an object');
	}

	// Create a settings block. This also validates the settings.
	const settings = mergeSettings(defaultSettings, appSettings, 'appSettings');
	
	// Build the ribbons
	return buildTrack(objSpecs, vectorFactory, settings);
}

TrackPOC.vector = {
	direction: function(from, to) {
		return vector.normalize(vector.difference(from, to));
	}
}

//export default TrackPOC;