const TrackPOC = {}

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

function checkForArray(name, value, minElements) {
	const ok = typeof(value) === 'object' &&
		value.constructor.toString().indexOf('Array') > -1;
	if (!ok) {
		throw new TypeError(`${name} must be an Array`);
	}
	if (value.length < minElements) {
		throw new RangeError(`${name} must have at least ${minElements} element(s)`);
	}
}

function checkForObject(name, value) {
	if (typeof(value) !== 'object') {
		throw new TypeError(`${name} must be an object`);
	}
}

function checkForVector(name, value, coords) {
	if (typeof(value) !== 'object') {
		throw new TypeError(`${name} must be an object`);
	}
	
	let result = {};
	for (let coord of coords) {
		if (typeof(value[coord]) !== 'number') {
			throw new TypeError(`${name}.${coord} must be a number`);
		}
		result[coord] = value[coord];
	}
	return result;
}
	
function checkForWeight(name, value) {
	if (value === null || value === undefined) return 1;
	if (typeof(value) !== 'number') {
		throw new TypeError(`${name} must be a number`);
	}
	if (value <= 0) {
		throw new RangeError(`${name} must be positive`);
	}
	return value;
}

function combineNames(prefix, name) {
	if (prefix.length == 0) return name;
	return prefix + '.' + name;
}

function jsonOrObject(o, name) {
	if (typeof(o) === 'string') return JSON.parse(o);
	else if (typeof(o) === 'object') return o;
	else throw new TypeError(`${name} must be an JSON string or object`);
}

function mergeSettings(namePrefix, masterSettings, overrideSettings) {
	const mergedSettings = {...masterSettings};
	for (let vs of validSettings) {
		if (!(overrideSettings[vs.key] === undefined || overrideSettings[vs.key] === null)) {
			mergedSettings[vs.key] = validateValue(namePrefix, vs, overrideSettings[vs.key]);
		}
	}
	return mergedSettings;
}

function validateValue(namePrefix, vs, value) {
	if (typeof(value) !== 'number') {
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

//==============================================================================
// VECTOR ROUTINES

const vector = {
	
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
	const left = vector.normalize(vector.cross(bp.forward, bp.roadBed));
	const wall = vector.multiply(-bp.wallHeight, bp.roadBed);
	const edgeDistance = bp.trackWidth / 2;
	const leftEdge = vector.add(bp.v, edgeDistance, left);
	const rightEdge = vector.add(bp.v, -edgeDistance, left);
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

	// Compute the point
	let coeffs = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
	const v = vector.sum(coeffs, curve.points);
	
	// Compute the slope
	coeffs = [3 * olt *olt, 6 * olt * t, 3 * t * t];
	const deltaPoints = [
		vector.add(curve.points[1], -1, curve.points[0]),
		vector.add(curve.points[2], -1, curve.points[1]),
		vector.add(curve.points[3], -1, curve.points[2]),
	];
	const forward = vector.sum(coeffs, deltaPoints);
	
	// TODO: Need to compute roadbed
	return {
		v: v,
		forward: forward,
		roadBed: vector.down,
		trackWidth: olt * curve.trackWidths[0] + t * curve.trackWidths[1],
		wallHeight: olt * curve.wallHeights[0] + t * curve.wallHeights[1],
	};
}

// Generate the Bezier cubic curve between t0 and t1
function interpolateCurve(ribbon, curve, t0, t1, bpt0, bpt1, vectorFactory, precision)
{
	// NOTE: A cubic Bezier curve generates points, or slices in our case,
	// p0, ..., pn where p0 is the point at t0 and pn is the point at t1.
	// However, for consecutive curves c and d, the last point of c is the
	// same as the first point of d. To avoid duplication of points in the
	// ribbon, this routine only adds points p0, ..., pn-1. Note that same
	// holds for contiguous sections of a curve.
	
	// Calculate the linear and curve midpoints of the current subsection
	const midtime = (t0 + t1) / 2;
	const lmp = vector.midpoint(bpt0.v, bpt1.v);	// Linear midpoint
	const bmp = getBezierPoint(curve, midtime);	// Bezier midpoint

	// TODO: This precision test is insufficient. It is possible for the curve to pass
	// through the linear midpoint but the tangent at the midpoint be different (e.g.,
	// an 'S' curve passing through the midpoint).
	
	// If the linear midpoint is close enough to the curve midpoint, add bmp0
	// to the  ribbon. Otherwise recursively add the sections of the curve
	// (t0, midtime) and (midtime, t1). Note that the latter eventually adds
	// the midpoint calcuated here.
	if (vector.distance(lmp, bmp.v) <= precision) {
		addRibbonSlice(ribbon, bpt0, vectorFactory);  
	} else {
		interpolateCurve(ribbon, curve, t0, midtime, bpt0, bmp, vectorFactory, precision);
		interpolateCurve(ribbon, curve, midtime, t1, bmp, bpt1, vectorFactory, precision);
	}
}

//==============================================================================
// SEGMENT BUILDER

function buildSegment(name, segment, vectorFactory, masterSettings, isClosed) {
	
	// Segment must be an object
	checkForObject(name, segment);
	
	// Create settings
	const settings = mergeSettings(name, masterSettings, segment);
	
	// Make sure that 'points' is an array with at least two elements
	checkForArray(name + '.points', segment.points, 2);
	
	// Convert points into internal representations
	const segmentPoints = [];
	for (let i = 0; i < segment.points.length; i++) {
		segmentPoints[i] = constructSegmentPoint(
			`${name}.points[${i}]`,
			segment.points[i],
			settings);
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
	
function constructSegmentPoint(name, rawPoint, masterSettings) {
	
	// The raw point must be an object
	checkForObject(name, rawPoint);
	
	// The raw point cannot have a 'precision' element
	if (rawPoint.precision != null) {
		throw new TypeError(`${name} cannot define precision`);
	}
	
	// Create the point with its settings and name
	const segmentPoint = mergeSettings(name, masterSettings, rawPoint);
	segmentPoint.name = name;
	
	// The raw point must have a center object with x, y, and z numeric
	// elements
	segmentPoint.center = checkForVector(
		name + '.center',
		rawPoint.center,
		coords3);
	
	// If the raw point has a 'forward' vector, validate that. Otherwise
	// use the vector (1, 0, 0)
	if (rawPoint.forward == null) {
		segmentPoint.forward = {x:1, y:0, z:0};
	} else {
		segmentPoint.forward = checkForVector(
			name + '.forward',
			rawPoint.forward,
			coords3);
	}
	
	// Get the weights
	segmentPoint.forwardWeight = this.checkForWeight(
		name + '.forwardWeight',
		rawPoint.forwardWeight);
	segmentPoint.backwardWeight = this.checkForWeight(
		name + '.backwardWeight',
		rawPoint.backwardWeight);
		
	// And we are done!
	return segmentPoint;
}

//==============================================================================
// TRACK BUILDER

function buildTrack(track, vectorFactory, masterSettings) {
	
	// Create settings
	const settings = mergeSettings('track', masterSettings, track);
	
	// Make sure that 'segments' is an array with at least one element
	checkForArray('track.segments', track.segments, 1); 
	
	// Check if this is a closed track
	const isClosed = track.segments.length == 1 && track.closed;
	
	// Loop through the segments
	const ribbons = [];
	for (let i = 0; i < track.segments.length; i++) {
		const ribbon = buildSegment(
			'track.segments[' + i.toString() + ']',
			track.segments[i],
			vectorFactory,
			settings,
			isClosed);
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
	if (typeof(vectorFactory) !== 'function') {
		throw new TypeError('vectorFactory must be a function');
	}
	if (typeof(appSettings) !== 'object') {
		throw new TypeError('appSettings must be an object');
	}

	// Create a settings block. This also validates the settings.
	const settings = mergeSettings('appSettings', defaultSettings, appSettings);
	
	// Build the ribbons
	return buildTrack(objSpecs, vectorFactory, settings);
}

TrackPOC.vector = {
	direction: function(from, to) {
		return vector.normalize(vector.difference(from, to));
	}
}

//export default TrackPOC;