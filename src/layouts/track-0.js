//----------------------------------------------------------------------
// Track 0a, track 0 with variable wall height

import Track from "../js/classes/Track";
import LayoutSettings from "../js/classes/LayoutSettings";
import {Vector3} from "@babylonjs/core";
import Layout from "../js/classes/Layout";

const defaultSettings = new LayoutSettings();

const name = 'track0';

const settings = {
	backwardWeight: defaultSettings.backwardWeight,
	forwardWeight: defaultSettings.forwardWeight,
	trackWidth: defaultSettings.trackWidth,
};

const segments = [{
	points: [
		{ center: new Vector3(2, 0, 0), forward: Track.posZ },	// Start position
		{ center: new Vector3(2, 0, 4), forward: Track.posZ },
		{ center: new Vector3(0, 0, 6), forward: Track.negX },
		{ center: new Vector3(-2, 0, 4), forward: Track.negZ },
		{ center: new Vector3(-2, 0, 0), forward: Track.negZ },
		{ center: new Vector3(-2, 0, -4), forward: Track.negZ },
		{ center: new Vector3(0, 0, -6), forward: Track.posX },
		{ center: new Vector3(2, 0, -4), forward: Track.posZ },
	],
}];

const track = new Layout({ name, settings, segments });
export default track;
