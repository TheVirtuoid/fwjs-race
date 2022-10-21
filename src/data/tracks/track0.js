import { posX, posZ, negX, negZ, posZ } from "../../js/models/track-definitions";

export default {
	family: 'Closed oval',
	points: [
		{ center: new BABYLON.Vector3(2, 0, 0), forward: posZ },	// Start position
		{ center: new BABYLON.Vector3(2, 0, 4), forward: posZ },
		{ center: new BABYLON.Vector3(0, 0, 6), forward: negX },
		{ center: new BABYLON.Vector3(-2, 0, 4), forward: negZ },
		{ center: new BABYLON.Vector3(-2, 0, -4), forward: negZ },
		{ center: new BABYLON.Vector3(0, 0, -6), forward: posX },
		{ center: new BABYLON.Vector3(2, 0, -4), forward: posZ },
	],
	track: {closed: true},
	options: {
		backwardWeight: 0.5,
		forwardWeight: 0.5,
		trackWidth: 0.5,
	},
	init: function() {
		this.track.segments = [{points: this.points}];
	}
}