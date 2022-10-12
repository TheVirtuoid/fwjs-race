//----------------------------------------------------------------------
// Track 2a, track 2 with bank

import {jrCatchDrop, jrDescent, jrGap, jrt5, jrv5, } from "./commonVariables";
import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {TrackTypes} from "./types";
import {Color3} from "@babylonjs/core";

const jrRadius = 14;
const trackWidth = 10;
const wallHeight = .75;

const startingPoint = { x: 50, y: 30, z: 0 };
let endsAt;
let startsAt;
/*
	Starting Line
 */
endsAt = {
	x: startingPoint.x - 10,
	y: startingPoint.y - 10,
	z: startingPoint.z
};
startsAt = {
	x: startingPoint.x,
	y: startingPoint.y,
	z: startingPoint.z
}
const startingLine = {
	type: TrackTypes.STRAIGHT,
	startsAt,
	endsAt,
	trackWidth,
	wallHeight
}

/*
const t2aep5 = {	// Start of curve
	center: jrv5,
	forward: jrt5,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 10,
	trackWidth,
	wallHeight
};
const t2aep6 = {	// Top of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep5.center.x - jrRadius,
		y: t2aep5.center.y - jrDescent / 1,
		z: t2aep5.center.z - jrRadius,
	},
	forward: Track.negZ,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 45,
	// trackBank: 10,
	trackWidth,
	wallHeight
};
const t2aep7 = {	// Left extent of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep6.center.x + jrRadius,
		y: t2aep6.center.y - jrDescent * 5,
		z: t2aep6.center.z - jrRadius
	},
	forward: Track.posX,
	forwardWeight: Track.circleWeight * jrRadius,
	trackBank: 45,
	// trackBank: 10,
	trackWidth,
	wallHeight
};
const t2aep8 = {	// End of curve
	backwardWeight: Track.circleWeight * jrRadius,
	center: {
		x: t2aep7.center.x + jrRadius,
		y: t2aep7.center.y - jrDescent * 10,
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

const jrep3 = {
	center: { x:.5, y:1, z:0 },
	forward: Track.negX,
	backwardWeight: 1,
	trackWidth,
	wallHeight
};

const jrep4 = {	// Start of catch
	center: {
		// x: jrep3.center.x - jrGap,
		x: jrep3.center.x,
		// y: jrep3.center.y - jrCatchDrop,
		y: jrep3.center.y,
		z: jrep3.center.z,
	},
	forward: Track.negX,
	trackWidth,
	wallHeight
};

const t2as2 = {
	points: [ jrep4, t2aep5, t2aep6, t2aep7, t2aep8, t2ep9 ]
};


const lv1 = { x:50 , y:30, z:0 };
const lv2 = { x:9, y:5, z:0 };
const launchStraight2 = {
	type: 'straight',
	endsAt: lv2,
	startsAt: lv1,
	// forwardWeight: 1.1,
	trackWidth,
	wallHeight
};
*/

/*
const jrs1 = {
	points: [ launchStraight2, jrep3 ]
};
const segments = [ jrs1, t2as2 ];
*/

const lv1 = { x:50 , y:30, z:0 };
const lv2 = { x:9, y:5, z:0 };
const launchStraight2 = {
	center: { x:60, y:29, z:0 },
	type: 'straight',
	endsAt: lv2,
	startsAt: lv1,
	trackWidth,
	wallHeight
};
const jrep3 = {
	center: { x:.5, y:1, z:0 },
	forward: Track.negX,
	backwardWeight: 1,
	trackWidth,
	wallHeight,
	color: new Color3.Green()
};
const four = {
	type: TrackTypes.STRAIGHT,
	startsAt: lv2,
	endsAt: { x: lv2.x - 50, y: lv2.y - 10, z: lv2.z },
	trackWidth,
	wallHeight
}
const jrs1 = {
	points: [ launchStraight2, jrep3, four ]
};
const segments = [ jrs1 ];

const name = 'track6';

export default new Layout({ name, segments });

