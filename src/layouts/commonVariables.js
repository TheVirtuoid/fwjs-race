import Track from "../js/classes/Track";

export const lv1 = { x:10 , y:5, z:0 };
export const lv2 = { x:9, y:4.9, z:0 };
export const lt1_2 = Track.vector.direction(lv1, lv2);
export const lep1 = {	// Start of starting ramp
	center: lv1,
	forward: lt1_2,
};
export const lep2 = {	// End of starting ramp, start of runout
	center: lv2,
	forward: lt1_2,
	forwardWeight: 1.1,
};
export const launchStraight1 = {
	type: 'straight',
	endsAt: lv2,
	forwardWeight: 1.1,
};
export const launchStraight2 = {
	type: 'straight',
	endsAt: lv2,
	startsAt: lv1,
	forwardWeight: 1.1,
};
// Straight with just length demonstrated elsewhere
//const launchStraight3 = {
//	type: 'straight',
//	length: 1.004987562112089,
//	forwardWeight: 1.1
//};
export const launchStraight4 = {
	type: 'straight',
	startsAt: lv1,
	forward: lt1_2,
	length: 1.004987562112089,
	forwardWeight: 1.1,
};

//----------------------------------------------------------------------
// Common jump ramp points

export const jrGap = 1;
export const jrRadius = 2;
export const jrCatchDrop = .1;
export const jrDescent = 1;

export const jrep3 = {
	center: { x:.5, y:1, z:0 },
	forward: Track.negX,
	backwardWeight: 4,
};

export const jrep4 = {	// Start of catch
	center: {
		x: jrep3.center.x - jrGap,
		y: jrep3.center.y - jrCatchDrop,
		z: jrep3.center.z,
	},
	forward: Track.negX,
};

export const jrv5 = {
	x: jrep4.center.x - jrRadius + jrGap / 2,
	y: jrep4.center.y - jrDescent / 4,
	z: jrep4.center.z
};

export const jrt5 = Track.negX;

export const jrs1 = {
	points: [ launchStraight2, jrep3 ]
};

