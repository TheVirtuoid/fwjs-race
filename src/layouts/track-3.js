//----------------------------------------------------------------------
// Track 3, slope into a jump with a turn right looping underneath the jump

import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {jrDescent, jrep4, jrRadius, jrs1, jrt5, jrv5} from "./commonVariables";

const t3ep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t3ep6 = {	// Top of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3ep5.center.x - jrRadius,
		y: t3ep5.center.y - jrDescent / 4,
		z: t3ep5.center.z + jrRadius,
	},
	forward: Track.posZ,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t3ep7 = {	// Right extent of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3ep6.center.x + jrRadius,
		y: t3ep6.center.y - jrDescent / 4,
		z: t3ep6.center.z + jrRadius
	},
	forward: Track.posX,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t3ep8 = {	// End of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t3ep7.center.x + jrRadius,
		y: t3ep7.center.y - jrDescent / 4,
		z: t3ep7.center.z - jrRadius
	},
	forward: Track.negZ,
};
const t3ep9 = {	// Runout
	type: 'straight',
	length: 2 * jrRadius,
};

const t3s2 = {
	points: [ jrep4, t3ep5, t3ep6, t3ep7, t3ep8, t3ep9 ]
};

const segments = [jrs1, t3s2];
const name = 'track3';

export default new Layout({ name, segments });
