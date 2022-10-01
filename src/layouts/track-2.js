//----------------------------------------------------------------------
// Track 2, slope into a jump with a turn left looping underneath the jump

// NOTE: This may need some adjustments on the curve to avoid bumps where
// we specify the tangent to have no y component.

import Track from "../js/classes/Track";
import {jrDescent, jrep4, jrRadius, jrs1, jrt5, jrv5} from "./commonVariables";
import Layout from "../js/classes/Layout";

const t2ep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t2ep6 = {	// Top of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2ep5.center.x - jrRadius,
		y: t2ep5.center.y - jrDescent / 4,
		z: t2ep5.center.z - jrRadius,
	},
	forward: Track.negZ,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t2ep7 = {	// Left extent of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2ep6.center.x + jrRadius,
		y: t2ep6.center.y - jrDescent / 4,
		z: t2ep6.center.z - jrRadius
	},
	forward: Track.posX,
	forwardWeight: Track.circleWeight * jrRadius,
};
const t2ep8 = {	// End of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2ep7.center.x + jrRadius,
		y: t2ep7.center.y - jrDescent / 4,
		z: t2ep7.center.z + jrRadius
	},
	forward: Track.posZ,
};
const t2ep9 = {	// Runout
	type: 'straight',
	length: 2 * jrRadius,
};

const segments = [
	jrs1,
	{ points: [ jrep4, t2ep5, t2ep6, t2ep7, t2ep8, t2ep9 ] }
];

const name = 'track2';

export default new Layout({name, segments });
