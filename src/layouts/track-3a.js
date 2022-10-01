//----------------------------------------------------------------------
// Track 3a, track 3 with bank

import {jrDescent, jrep4, jrRadius, jrs1, jrt5, jrv5} from "./commonVariables";
import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";

const t3aep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: -10,
};
const t3aep6 = {	// Top of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3aep5.center.x - jrRadius,
		y: t3aep5.center.y - jrDescent / 4,
		z: t3aep5.center.z + jrRadius,
	},
	forward: Track.posZ,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: -45,
};
const t3aep7 = {	// Right extent of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3aep6.center.x + jrRadius,
		y: t3aep6.center.y - jrDescent / 4,
		z: t3aep6.center.z + jrRadius
	},
	forward: Track.posX,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: -45,
};
const t3aep8 = {	// End of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3aep7.center.x + jrRadius,
		y: t3aep7.center.y - jrDescent / 4,
		z: t3aep7.center.z - jrRadius
	},
	forward: Track.negZ,
	trackBank: -10,
};
const t3ep9 = {	// Runout
	type: 'straight',
	length: 2 * jrRadius,
};

const t3as2 = {
	points: [ jrep4, t3aep5, t3aep6, t3aep7, t3aep8, t3ep9 ]
};

const segments = [jrs1, t3as2];
const name = 'track3a';

export default new Layout({ name, segments });

