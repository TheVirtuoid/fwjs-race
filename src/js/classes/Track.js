import Vector from "./Vector";
import {isFunction, isObject} from "../helpers/typeCheck";
import {validateSizedArray} from "../helpers/validators";
import {Vector3} from "@babylonjs/core";
import {jsonOrObject, mergeSettings} from "../helpers/util";
import Segment from "./Segment";
import LayoutSettings from "./LayoutSettings";

const defaultSettings = new LayoutSettings().toObject();

export default class Track {
	static build (specs, vectorFactory, appSettings = {}) {

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
		return Track.#buildTrack(objSpecs, vectorFactory, settings);
	}

	static vector = {
		direction: function(from, to) {
			return Vector.normalize(Vector.difference(from, to));
		}
	}

	static #buildTrack(track, vectorFactory, masterSettings) {

		// Create settings
		const settings = mergeSettings(masterSettings, track, 'track');

		// Make sure that 'segments' is an array with at least one element
		validateSizedArray(track.segments, 1, 'track.segments');

		// Check if this is a closed track
		const isClosed = track.segments.length === 1 && track.closed;

		// Loop through the segments
		const ribbons = [];
		for (let i = 0; i < track.segments.length; i++) {
			ribbons[i] = Segment.buildSegment(
					track.segments[i],
					vectorFactory,
					settings,
					isClosed,
					'track.segments[' + i.toString() + ']');
		}
		return ribbons;
	}

	static posX = new Vector3.Right;
	static negX = new Vector3.Left;
	static posY = new Vector3.Up;
	static negY = new Vector3.Down;
	static posZ = new Vector3.Forward;
	static negZ = new Vector3.Backward;
	static zero = { x:0, y:0, z:0 };

	// See https://spencermortensen.com/articles/bezier-circle/
	// If we want a closer approximation, we would need to break the
	// convention that backward = -forward and allow backward to be
	// forward rotated 180 degrees around down.
	static circleWeight = 0.5519150244935105707435627;

}