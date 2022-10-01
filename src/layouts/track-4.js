//----------------------------------------------------------------------
// Track 4, slope into a loop

// See https://spencermortensen.com/articles/bezier-circle/
// If we want a closer approximation, we would need to break the
// convention that backward = -forward and allow backward to be
// forward rotated 180 degrees around down.

import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {lep1, lep2} from "./commonVariables";

const t4loopRadius = 3;
const t4loopOffset = .4;
const t4loopWeight = Track.circleWeight * t4loopRadius;

const t4ep3 = {	// End of slope, start of flat
	center: Track.zero,
	forward: Track.negX,
	backwardWeight: 4,
};
const t4ep4 = {	// Entry into loop
	center: {
		x: t4ep3.center.x - t4loopRadius,
		y: t4ep3.center.y,
		z: t4ep3.center.z
	},
	forward: Track.negX,
	forwardWeight: t4loopWeight,
};
const t4ep5 = {	// First quarter of loop
	backwardWeight: t4loopWeight,
	center: {
		x: t4ep4.center.x - t4loopRadius,
		y: t4ep4.center.y + t4loopRadius,
		z: t4ep4.center.z + t4loopOffset
	},
	forward: Track.posY,	// This should have a small z-component
	forwardWeight: t4loopWeight,
	trackBank: Track.negX,
};
const t4ep6 = {	// Top of loop
	backwardWeight: t4loopWeight,
	center: {
		x: t4ep5.center.x + t4loopRadius,
		y: t4ep5.center.y + t4loopRadius,
		z: t4ep5.center.z + t4loopOffset
	},
	forward: Track.posX,	// This should have a small z-component
	forwardWeight: t4loopWeight,
	trackBank: Track.posY,
};
const t4ep7 = {	// Last quarter of loop
	backwardWeight: t4loopWeight,
	center: {
		x: t4ep6.center.x + t4loopRadius,
		y: t4ep6.center.y - t4loopRadius,
		z: t4ep6.center.z + t4loopOffset
	},
	forward: Track.negY,	// This should have a small z-component
	forwardWeight: t4loopWeight,
	trackBank: Track.posX,
};
const t4ep8 = {	// Exit of loop
	backwardWeight: t4loopWeight,
	center: {
		x: t4ep7.center.x - t4loopRadius,
		y: t4ep7.center.y - t4loopRadius,
		z: t4ep7.center.z + t4loopOffset
	},
	forward: Track.negX,
};
const t4ep9 = {	// Runout
	type: 'straight',
	length: 2 * t4loopRadius,
};

const segments = [{
	points: [ lep1, lep2, t4ep3, t4ep4, t4ep5, t4ep6, t4ep7, t4ep8, t4ep9 ]
}];

const name = 'track4';

export default new Layout({ name, segments });
