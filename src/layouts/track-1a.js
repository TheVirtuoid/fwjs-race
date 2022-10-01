import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {launchStraight2, lep1} from "./commonVariables";

const t1aep3 = {	// End of slope, start of runout
	center: Track.zero,
	forward: Track.negX,
	backwardWeight: 4,
};
const t1aep4 = {	// End of runout flat
	type: 'straight',
	length: 2,
	trackWidth: 2,
};

const segments = [{
	points: [ lep1, launchStraight2, t1aep3, t1aep4 ]
}];

const name = 'track1a';

export default new Layout({ name, segments });
