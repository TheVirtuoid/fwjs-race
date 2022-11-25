import Straight from "./Straight";
import {Color3, MeshBuilder, PhysicsImpostor, Vector3} from "@babylonjs/core";
import Section from "./Section";
import Segment from "./Segment";

export default (args = {}) => {

	const { startsAt, scene } = args;
	console.log(startsAt);
	const stopWidth = .25;
	const stopColor = new Color3.Black().toColor4();
	const stopOptions = {
		height: 3,
		depth: 3,
		width: stopWidth,
		faceColors: [stopColor, stopColor, stopColor, stopColor, stopColor, stopColor]
	}
	const stopGate = MeshBuilder.CreateBox('stopGate', stopOptions, scene);
	stopGate.position = new Vector3(startsAt.x, startsAt.y, startsAt.z);
	stopGate.physicsImpostor = new PhysicsImpostor(stopGate, PhysicsImpostor.BoxImpostor, { friction: 5000, mass: 0, restitution: 0 });

	const finishLine = {};
	finishLine.track = Section.createStraight({ length: 10, physicsOptions: { friction: 1 } });
	return finishLine;

}

