import {
	validateObject,
	validatePositiveNumber,
	validateSizedArray,
	validateVector3,
	validateWeight
} from "../helpers/validators";
import {mergeSettings} from "../helpers/util";
import {isDefined} from "../helpers/typeCheck";
import Vector from "./Vector";
import Ribbon from "./Ribbon";
import Bezier from "./bezier";

export default class Segment {

	static buildSegment(segment, vectorFactory, masterSettings, isClosed, nameStr) {

		// Segment must be an object
		validateObject(segment, nameStr);

		// Create settings
		const settings = mergeSettings(masterSettings, segment, nameStr);

		// Make sure that 'points' is an array with at least one element
		validateSizedArray(segment.points, 1, () => { return nameStr + '.points' });

		// Reform the points array into two arrays of n section builders and
		// n+1 segment points
		const builders = [];
		const points = [];
		for (let i = 0; i < segment.points.length; i++) {
			Segment.parseSection(builders, points, segment.points[i], settings, `${nameStr}.points[${i}]`);
		}

		// Ensure we have at least one builder and two segment points
		validateSizedArray(points, 2, () => { return nameStr + '.points' });

		// Loop through the builders, creating curves between them
		const ribbon = Ribbon.createRibbon();
		let lastPoint = null;
		for (let i = 0; i < builders.length; i++) {
			lastPoint = Segment.executeBuilder(builders[i], ribbon, points[i], points[i+1], vectorFactory);
		}

		// If this is not a closed segment, add the last point to the ribbon
		if (!isClosed) {
			Ribbon.addRibbonSlice(ribbon, lastPoint, vectorFactory, settings);
		}

		return ribbon;
	}

	static sectionParsers = {
		point: Segment.parsePoint,
		straight: Segment.parseStraight,
	};

	static parseSection(builders, points, rawPoint, masterSettings, nameStr) {

		// The raw point must be an object
		validateObject(rawPoint, nameStr);

		// Check the type
		const sectionType = isDefined(rawPoint.type) ? rawPoint.type : 'point';
		const sectionParser = Segment.sectionParsers[sectionType];
		if (!isDefined(sectionParser)) {
			throw new TypeError(`${nameStr}.type of '${sectionType}' is not recognized`);
		}

		// Parse the section
		sectionParser(builders, points, rawPoint, masterSettings, nameStr);
	}

	static parsePoint(builders, points, rawPoint, masterSettings, nameStr) {

		// The raw point cannot have a 'precision' element
		if (isDefined(rawPoint.precision)) {
			throw new TypeError(`${nameStr} cannot define precision`);
		}

		// Create the point with its settings and name
		const segmentPoint = mergeSettings(masterSettings, rawPoint, nameStr);
		segmentPoint.name = nameStr;

		// The raw point must have a center object with x, y, and z numeric
		// elements
		segmentPoint.center = validateVector3(rawPoint.center, () => { return nameStr + '.center'; });

		// If the raw point has a 'forward' vector, validate that. Otherwise
		// use the vector (1, 0, 0)
		if (rawPoint.forward == null) {
			segmentPoint.forward = Vector.right;
		} else {
			segmentPoint.forward = validateVector3(rawPoint.forward, () => { return nameStr + '.forward'; });
		}

		// Get the weights
		segmentPoint.forwardWeight = validateWeight(
				rawPoint.forwardWeight,
				() => { return nameStr + '.forwardWeight'; });
		segmentPoint.backwardWeight = validateWeight(
				rawPoint.backwardWeight,
				() => { return nameStr + '.backwardWeight'; });

		// And we are done!
		points.push(segmentPoint);
		if (points.length > 1) builders.push(Segment.createBuilder(Bezier.buildCurve, masterSettings));
	}

	static parseStraight(builders, points, rawStraight, masterSettings, nameStr) {

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
		const usesLength = isDefined(rawStraight.length);
		const usesEndsAt = isDefined(rawStraight.endsAt);
		if (!usesLength && !usesEndsAt) {
			throw new TypeError(`${nameStr} must define 'length' or 'endsAt'`);
		}
		if (usesLength && usesEndsAt) {
			throw new TypeError(`${nameStr} cannot define both 'length' and 'endsAt'`);
		}

		// Create the end point with its settings and name
		const endPoint = mergeSettings(masterSettings, rawStraight, nameStr);
		endPoint.name = nameStr;
		if (usesEndsAt) {
			endPoint.center = validateVector3(rawStraight.endsAt, () => { return nameStr + '.endsAt'; });
		}

		// Get the starting vertex
		let startPoint;
		const generateStart = points.length === 0;
		if (!generateStart) {
			startPoint = points[points.length - 1];
		} else {
			startPoint = mergeSettings(masterSettings, rawStraight, nameStr);
			startPoint.name = nameStr + '*';
			startPoint.center = validateVector3(rawStraight.startsAt, () => { return nameStr + '.startsAt'; });
			startPoint.forwardWeight = validateWeight(rawStraight.startingWeight, () => { return nameStr + '.startingWeight'; });
			if (usesEndsAt) {
				endPoint.forward = Vector.normalize(Vector.difference(startPoint.center, endPoint.center));
				startPoint.forward = endPoint.forward;
			} else {
				startPoint.forward = validateVector3(rawStraight.forward, () => { return nameStr + '.forward'; });
			}
		}

		// Compute the end point's center and forward
		if (usesLength) {
			const length = validatePositiveNumber(rawStraight.length, () => { return nameStr + '.length'; });
			endPoint.center = Vector.add(startPoint.center, length, startPoint.forward);
			endPoint.forward = startPoint.forward;
		} else if (!generateStart) {
			endPoint.forward = Vector.normalize(Vector.difference(startPoint.center, endPoint.center));
		}

		// Get the weights
		endPoint.forwardWeight = validateWeight(rawStraight.forwardWeight, () => { return nameStr + '.forwardWeight'; });
		endPoint.backwardWeight = validateWeight(rawStraight.backwardWeight, () => { return nameStr + '.backwardWeight'; });

		// And we are done!
		if (generateStart) {
			points.push(startPoint);
		}
		points.push(endPoint);
		builders.push(Segment.createBuilder(Bezier.buildCurve, masterSettings));
	}

	static createBuilder(builder, settings) {
		return {
			builder: builder,
			precision: settings.precision
		}
	}

	static executeBuilder(builder, ribbon, sp0, sp1, vectorFactory) {
		return builder.builder(ribbon, sp0, sp1, vectorFactory, builder.precision);
	}

	static prependPoints(segment, points) {
		const segmentPoints = segment.points || [];
		segment.points = points.concat(segmentPoints);
		return segment;
	}

}