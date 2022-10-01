//----------------------------------------------------------------------
// Track 2a, track 2 with bank

import {jrDescent, jrep4, jrRadius, jrs1, jrt5, jrv5} from "./commonVariables";
import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";

const t2aep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 10,
};
const t2aep6 = {	// Top of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep5.center.x - jrRadius,
		y: t2aep5.center.y - jrDescent / 4,
		z: t2aep5.center.z - jrRadius,
	},
	forward: Track.negZ,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 45,
};
const t2aep7 = {	// Left extent of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep6.center.x + jrRadius,
		y: t2aep6.center.y - jrDescent / 4,
		z: t2aep6.center.z - jrRadius
	},
	forward: Track.posX,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 45,
};
const t2aep8 = {	// End of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep7.center.x + jrRadius,
		y: t2aep7.center.y - jrDescent / 4,
		z: t2aep7.center.z + jrRadius
	},
	forward: Track.posZ,
	trackBank: 10,
};

const t2ep9 = {	// Runout
	type: 'straight',
	length: 2 * jrRadius,
};

const t2as2 = {
	points: [ jrep4, t2aep5, t2aep6, t2aep7, t2aep8, t2ep9 ]
};

const segments = [ jrs1, t2as2 ];

const name = 'track2a';

export default new Layout({ name, segments });

