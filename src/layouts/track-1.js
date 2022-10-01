import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {launchStraight1, lep1} from "./commonVariables";

const t1ep3 = {	// End of slope, start of runout
	center: Track.zero,
	forward: Track.negX,
	backwardWeight: 4,
};
const t1ep4 = {	// End of runout flat
	type: 'straight',
	length: 2,
};

const segments = [{
	points: [ lep1, launchStraight1, t1ep3, t1ep4 ]
}];

const name = 'track1';

const track = new Layout({ name, segments });

export default track;