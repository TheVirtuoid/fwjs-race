import Track from "../js/classes/Track";
import Layout from "../js/classes/Layout";
import {launchStraight4} from "./commonVariables";

const t1bep3 = {	// End of slope, start of runout
	center: Track.zero,
	forward: Track.negX,
	backwardWeight: 4,
};
const t1bep4 = {	// End of runout flat
	type: 'straight',
	length: 2,
	trackWidth: 2,
};

const segments = [{
	points: [ launchStraight4, t1bep3, t1bep4 ]
}];

const name = 'track1b';

export default new Layout({ name, segments });