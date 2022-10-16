//----------------------------------------------------------------------
// Track 2a, track 2 with bank

import {jrCatchDrop, jrDescent, jrGap, jrt5 } from "./commonVariables";
import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";

const trackWidth = 6;
const jrRadius = 12
const trackBank = 40;
const wallHeight = .75;

const jrep3 = {
	center: { x:.5, y:1, z:0 },
	forward: Track.negX,
	backwardWeight: 4,
	trackWidth,
	wallHeight
};

const jrep4 = {	// Start of catch
	center: {
		x: jrep3.center.x,
		y: jrep3.center.y,
		z: jrep3.center.z,
	},
	forward: Track.negX,
	trackWidth,
	wallHeight
};

const jrv5 = {
	x: jrep4.center.x - jrRadius,
	y: jrep4.center.y - jrDescent / 4,
	z: jrep4.center.z
};

const lv1 = { x:30 , y:30, z:0 };
const lv2 = { x:9, y:4.9, z:0 };

const launchStraight2 = {
	type: 'straight',
	endsAt: lv2,
	startsAt: lv1,
	forwardWeight: 1.1,
	trackWidth,
	wallHeight
};


const t2aep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 30,
	trackWidth,
	wallHeight
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
	trackBank,
	trackWidth,
	wallHeight
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
	trackBank,
	trackWidth,
	wallHeight
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
	trackWidth,
	wallHeight
};

const t2ep9 = {	// Runout
	type: 'straight',
	length: 2 * jrRadius,
	trackWidth,
	wallHeight
};


const jrs1 = {
	points: [ launchStraight2, jrep3 ]
};


const t2as2 = {
	points: [ jrep4, t2aep5, t2aep6, t2aep7, t2aep8, t2ep9 ]
};

const segments = [ jrs1, t2as2 ];

const name = 'track5';

export default new Layout({ name, segments });

