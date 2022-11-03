import bezier from './bezier.js'
import is from './is.js'
import merge from './merge.js'
import TrackSegment from './TrackSegment.js'
import sectionParser from './sectionParser.js'
import validate from './validate.js'

export function createBuilder(settings) {
	return {
		precision: settings.precision
	}
}

function executeBuilder(builder, trackSegment, sp0, sp1, vectorFactory) {
	return bezier.build(trackSegment, sp0, sp1, vectorFactory, builder.precision);
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
	const trackSegment = new TrackSegment();
	let lastPoint = null;
	for (let i = 0; i < builders.length; i++) {
		lastPoint = executeBuilder(builders[i], trackSegment, points[i], points[i+1], vectorFactory);
	}

	// If this is not a closed segment, add the last point to the track segment
	if (!isClosed) {
		trackSegment.push(lastPoint, vectorFactory, settings);
	}

	return trackSegment;
}

function buildTrack(track, vectorFactory, parentSettings) {

	// Create settings
	const settings = merge.settings(parentSettings, track, 'track');

	// Make sure that 'segments' is an array with at least one element
	validate.sizedArray(track, 'segments', 'track', 1);

	// Check if this is a closed track
	const isClosed = track.segments.length == 1 && track.closed;

	// Loop through the segments
	const trackSegments = [];
	for (let i = 0; i < track.segments.length; i++) {
		trackSegments.push(buildSegment(
			track.segments[i],
			vectorFactory,
			settings,
			isClosed,
			'track.segments[' + i.toString() + ']'));
	}
	return trackSegments;
}

export function TrackPOC(specs, vectorFactory, appSettings = {}) {

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
}
