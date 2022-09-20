const TrackBuilder = {}

//==============================================================================
// HELPER ROUTINES

const defaultSettings = {
	precision: .5,
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
	for (let coord in coords) {
		if (typeof(value[coord]) !== 'number') {
			throw new TypeError(`${name}.${coord} must be a number`);
		}
		result[coord] = value[coord];
	}
	return result;
}
	
function checkForWeight(name, value) {
	if (value == null) return 1;
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

function mergeSettings(masterSettings, overrideSettings, namePrefix) {
	const mergedSettings = {...masterSettings};
	for (let vs of validSettings) {
		if (overrideSettings[vs.key] !== null) {
			mergedSettings[vs.key] = validateValue(vs, overrideSettings[vs.key], namePrefix);
		}
	}
}

function validateValue(vs, value, namePrefix) {
	if (typeof(value) !== 'number') {
		throw new TypeError(`${combineNames(prefix, vs.key)} must be a number`);
	}
	if (vs.isPositive && value <= 0) {
		throw new RangeError(`${combineNames(prefix, vs.key)} number be positive`);
	}
	let v = value;
	if (vs.normalizeDegrees) {
		v %= 360;
		if (v > 180) v -= 360;
		if (b <= -180) v += 360;
	}
	return v;
}

//==============================================================================
// RIBBON MANAGEMENT

function addRibbonSlice(ribbon, point, direction, vectorFactory, settings) {
	// Assume we can use (0, 0, 1) to compute the right vector. If the track
	// ever can turn upside down or become vertical, we need to add a right or
	// down vector to allow proper computation of the edges.
	
	// Alternatively we may need to use a quaterion to handle rotation.
}

function createRibbon() {
	// Left wall top, left road edge, right road edge, right wall top
	return [ [], [], [], [] ];
}

//==============================================================================
// BEZIER CURVE BUILDER

function buildCurve(ribbon, sp0, sp1, vectorFactory, settings, includeFirst) {
		
	// Compute the Bezier cubic curve points
	const points = [
		sp0.center,
		addVector(sp0.center, sp0.forwardWeight, sp0.forward),
		addVector(sp1.center, -sp1.backwardWeight, sp1.forward),
		sp1.center,
	];
	
	// Add the first point if required
	if (includeFirst) {
		addRibbonSlice(ribbon, points[0], points[1], vectorFactory, settings);
	}
	
	// Fill out the curve
	interpolateCurve(ribbon, points, 0, 1, points[0], points[3], vectorFactory, settings);
}

function addVector(v, k, w) {
	return {
		x: v.x + k * w.x,
		y: v.y + k * w.y,
		z: v.z + k * w.z,
	}
}

/*
const CurveFactory = {
	
	combineVectors: function(coeffs, vectors) {
		const result = {x:0, y:0, z:0};
		for (let i = 0; i < coeffs.length; i++) {
			const k = coeffs[i];
			const v = vectors[i];
			for (let coord in result) result[dimension] += k * v[dimension];
		}
	}

	
	addVectorDiff: function(v, k, w1, w2) {
		return {
			x: v.x + k * (w1.x - w2.x),
			y: v.y + k * (w1.y - w2.y),
			z: v.z + k * (w1.z - w2.z),
		}
	}
	
	
	getBezierPoint: function(points, t) {
		const olt = 1 - t;	// one less t

		// Compute the point
		let coeffs = [olt * olt * olt, 3 * olt * olt * t, 3 * olt * t * t, t * t * t];
		const v = addVectors(coeffs, points);
		
		// Compute the slope
		coeffs = [3 * olt *olt, 6 * olt * t, 3 * t * t];
		const deltaPoints = [;
			addVector(points[1], -1, points[0]),
			addVector(points[2], -1, points[1]),
			addVector(points[3], -1, points[2]),
		];
		const direction = addVectors(coeffs, deltaPoints);
		
		return {v: v, direction: direction};
	}

	interpolation: function(points, t0, t1, p0, p1,
		vectorFactory, precision, includeFirst) {
			
		// Get Bezier midpoint
		tm = (to + t1) / 2;
	}
}
*/

//==============================================================================
// SEGMENT BUILDER

function buildSegment(segment, vectorFactory, masterSettings, name) {
	
	// Segment must be an object
	checkForObject(segment, name);
	
	// Create settings
	const settings = mergeSettings(masterSettings, segment, name);
	
	// Make sure that 'points' is an array with at least two elements
	checkForArray(name + '.points', segment.points, 2);
	
	// Convert points into internal representations
	const segmentPoints = [];
	for (let i = 0; i < segment.points.length; i++) {
		segmentPoints[i] = constructSegmentPoint(
			segment.points[i],
			masterSettings,
			`${name}.points[${i}]`);
	}
	
	// Loop through the points, creating curves between them
	const ribbon = createRibbon();
	for (let i = 1; i < segmentPoints.length; i++) {
		buildCurve(ribbon, segmentPoints[i - 1], segmentPoints[i], vectorFactory, settings, i === 1);
	}
	return ribbon;
}
	
function constructSegmentPoint(rawPoint, masterSettings, name) {
	
	// The raw point must be an object
	checkForObject(name, rawPoint);
	
	// The raw point cannot have a 'precision' element
	if (rawPoint.precision != null) {
		throw new TypeError(`${name} cannot define precision`);
	}
	
	// Create the point with its settings and name
	const segmentPoint = mergeSettings(masterSettings, rawPoint, name);
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

const TrackFactory = {
	
	build: function(track, vectorFactory, masterSettings) {
		
		// Create settings
		const settings = mergeSettings(masterSettings, track, 'track');
		
		// Make sure that 'segments' is an array with at least one element
		checkForArray('track.segments', track.segment, 1); 
		
		// Loop through the segments
		const ribbons = [];
		for (let i = 0; i < track.segments.length; i++) {
			const ribbon = buildSegment(
				track.segments[i],
				vectorFactory,
				settings,
				'track.segments[' + i.toString() + ']');
			ribbons[i] = ribbon;
		}
		return ribbons;
	}
}

//==========================================================================
// API

// specs			a specification object or a json serialization of a
//					specification object
// vectorFactory	function to build an application friendly 3D vector,
//					v = vectorFactory(x, y, z)
// appSettings		application settings for the build
TrackBuilder.build = function(specs, vectorFactory, appSettings = {}) {
	
	// Validate the arguments
	const objSpecs = jsonOrObject(specs, 'specs');
	if (typeof(vectorConstructor) !== 'function') {
		throw new TypeError('vectorConstructor must be a function');
	}
	if (typeof(settings) !== 'object') {
		throw new TypeError('defParams must be an object');
	}

	// Create a settings block. This also validates the settings.
	const settings = mergeSettings(defaultSettings, appSettings, 'appSettings');
	
	// Build the ribbons
	return TrackFactory.build(objSpecs, vectorFactory, settings);
}

export default TrackBuilder;

/*
function checkForNumber(name, value) {
	const ok = typeof value === 'number';
	if (!ok) {
		throw new TypeError(`${name} must be a number`);
	}
}

function checkForObject(name, className, value) {
	const ok = typeof value === 'object' && value.constructor.toString().indexOf(className) > -1;
	if (!ok) {
		throw new TypeError(`${name} must be a(n) ${className}`);
	}
}

function checkForPositiveNumber(name, value) {
	checkForNumber(name, value);
	const ok = value > 0;
	if (!ok) {
		throw new RangeError(`${name} must be a positive number`);
	}
}

// Return a value in the range (-180, 180]
function normalizeDegrees(value) {
	let angle = value % 360;
	if (angle > 180) return angle - 360;
	if (angle <= -180) return angle + 360;
	return angle;
}

function addVectors(v, k, w) {
	return {
		x: v.x + k * w.x,
		y: v.y + k * w.y,
		z: v.z + k * w.z
	}
}

function scaleVector(k, v) {
	return {
		x: k * v.x,
		y: k * v.y,
		z: k * v.z
	}
}

function interpolateSegment(path, ep0, cp0, cp1, ep1, t0, t1, p0, p1, params) {
	
	// Compute the midpoint
	const t = (t0 + t1) / 2;
	const olt = 1 - t;	// one less than t
	let midpoint = scaleVector(olt * olt * olt, ep0);
	midpoint = addVectors(midpoint, 3 * olt * olt * t, cp0);
	midpoint = addVectors(midpoint, 3 * olt * t * t, cp1);
	midpoint = addVectors(midpoint, t * t * t, ep1);

	// Check if the midpoint is too far off the precision
	const normal = normalVector(p0, p1);
	const offline = false; // TODO
	
	// If offline, recurse
	if (offline) {
		interpolateSegment(path, ep0, cp0, cp1, ep1, t0, t, p0, midpoint, params);
		interpolateSegment(path, ep0, cp0, cp1, ep1, t, t1, midpoint, p1, params);
	}
	
	// If within precision, push the p1 point
	else path.push(p1);
}

function addSegment(path, points, index, params) {
	const p0 = points[index - 1];
	const p1 = points[index];
	const ep0 = p0.center;
	const ep1 = p1.center;
	const cp0 = addVectors(ep0, p0.forwardWeight, p0.forward);
	const cp1 = addVectors(ep1, -p1.backwardWeight, p1.forward);
	interpolateSegment(path, ep0, cp0, cp1, ep1, 0, 1, ep0, ep1, params);
}

function buildTrack(track, params) {

	const centerPath = [];
	const points = track.points;
	centerPath.push(points[0].center);
	for (let i = 1; i < points.length; i++) {
		addSegement(centerPath, points, i, params);
	}
	
	// HACK! We use the direction from one center point to the next do determine the direction
	// of the track and hence the direction of the track width. We should instead use the direction
	// of the Bezier curve at this point.
	const leftRoad = [];
	const rightRoad = [];

	function ComputeEdges(p0, p1) {
		const forward = p1.subtract(p0);
		forward.normalize();
		const left = forward.cross(up);
		left.scaleInPlace(trackWidth / 2);
		innerPath.push(p0.add(left));
		outerPath.push(p0.subtract(left));
	}
	
	for (let i = 1; i < centerPath.length; i++) {
		ComputeEdges(centerPath[i-1], centerPath[i]);
	}
	ComputeEdges(centerPath[centerPath.length-1], centerPath[0]);
}

function getValue(value, defValue, validator) {
	if (value == null) return defValue;
	return validator(value);
}

export default class BabylonBuilder {
	
	constructor() {
		throw new Error('Not implemented');
	}
	
	static build(layout, params = {}) {
		
		params.trackWidth = getValue(params.trackWidth, 2, (v) => {
			checkForPositiveNumber('trackWidth', v);
			return v;
		});
		params.trackBank = getValue(params.trackBank, 0, (v) => {
			checkForNumber('trackBank', v);
			return normalizeDegrees(v);
		});
		params.wallHeight = getValue(params.wallHeight, .5, (v) => {
			checkForPositiveNumber('wallHeight', v);
			return v;
		});
		params.precision = getValue(params.precision, .5, (v) => {
			checkForPositiveNumber('precision', v);
			return v;
		});
		
		const ribbons = [];
		for (let track of layout.tracks) {
			ribbons.push(buildTrack(track, params));
		}
		return ribbons;
	}
}
*/