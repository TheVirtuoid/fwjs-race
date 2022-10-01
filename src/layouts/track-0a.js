//----------------------------------------------------------------------
// Track 0a, track 0 with variable wall height

import {Vector3} from "@babylonjs/core";
import Track from "../js/classes/Track";
import LayoutSettings from "../js/classes/LayoutSettings";
import Layout from "../js/classes/Layout";


const defaultSettings = new LayoutSettings();
const settings = {
	backwardWeight: defaultSettings.backwardWeight,
	forwardWeight: defaultSettings.forwardWeight,
	trackWidth: defaultSettings.trackWidth
};
const name = 'track0';

const track = new Layout({ name, settings })

track.addSegment({
	points: [
		{ center: new Vector3(2, 0, 0), forward: Track.posZ },	// Start position
		{ center: new Vector3(2, 0, 4), forward: Track.posZ, wallHeight: .6 },
		{ center: new Vector3(0, 0, 6), forward: Track.negX, wallHeight: .7 },
		{ center: new Vector3(-2, 0, 4), forward: Track.negZ, wallHeight: .6 },
		{ center: new Vector3(-2, 0, 0), forward: Track.negZ },
		{ center: new Vector3(-2, 0, -4), forward: Track.negZ },
		{ center: new Vector3(0, 0, -6), forward: Track.posX },
		{ center: new Vector3(2, 0, -4), forward: Track.posZ },
	],
});

export default track;