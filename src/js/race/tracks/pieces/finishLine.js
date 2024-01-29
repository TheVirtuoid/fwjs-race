import Straight from "./Straight";
import {Color3, MeshBuilder, PhysicsImpostor, StandardMaterial, Texture, Vector3, Ray, Color4} from "@babylonjs/core";
import Section from "./Section";
import Segment from "./Segment";

export default (args = {}) => {

	const { startsAt, finishLine, scene } = args;
	const stopWidth = .25;
	const stopColor = Color3.Black().toColor4();
	const stopOptions = {
		height: 3,
		depth: 3,
		width: stopWidth,
		faceColors: [stopColor, stopColor, stopColor, stopColor, stopColor, stopColor]
	}
	const stopGate = MeshBuilder.CreateBox('stopGate', stopOptions, scene);
	stopGate.position = new Vector3(startsAt.x, startsAt.y, startsAt.z);
	stopGate.physicsImpostor = new PhysicsImpostor(stopGate, PhysicsImpostor.BoxImpostor, { friction: 5000, mass: 0, restitution: 0 });

	const finishLineMaterial = new StandardMaterial('finish-line', scene);
	finishLineMaterial.diffuseTexture = new Texture('/models/textures/checkerboard.jpg');

	/*const finishMarker = MeshBuilder.CreateBox('finishMarker', {height: 3, depth: 3, width: stopWidth }, scene);
	finishMarker.material = finishLineMaterial;
	finishMarker.position = new Vector3(finishLine.x, finishLine.y, finishLine.z);*/

	const finishLineLeft = MeshBuilder.CreateBox('finishLineLeft', { height: 4, depth: 1, width: stopWidth }, scene);
	finishLineLeft.material = finishLineMaterial;
	finishLineLeft.position = new Vector3(finishLine.x, finishLine.y + 2, finishLine.z - 4);

	const finishLineRight = MeshBuilder.CreateBox('finishLineRight', { height: 4, depth: 1, width: stopWidth }, scene);
	finishLineRight.material = finishLineMaterial;
	finishLineRight.position = new Vector3(finishLine.x, finishLine.y + 2, finishLine.z + 4);

	const finishLineTop = MeshBuilder.CreateBox('finishLineLeft', { height: 1, depth: 8, width: stopWidth }, scene);
	finishLineTop.material = finishLineMaterial;
	finishLineTop.position = new Vector3(finishLine.x, finishLine.y + 4, finishLine.z);

	const directionVectorOrigin = new Vector3(finishLineLeft.position.x, finishLineLeft.position.y - 1.5, finishLineLeft.position.z);
	const directionVectorTerminator = new Vector3(finishLineRight.position.x, finishLineRight.position.y - 1.5, finishLineRight.position.z);
	const directionVector = directionVectorTerminator.subtract(directionVectorOrigin);

	MeshBuilder.CreateLines('test',
			{
				colors: [ Color3.Green().toColor4(), Color3.Green().toColor4()],
				points: [directionVectorOrigin, directionVectorTerminator]
			},
			scene);

	let count = 0;

	const finished = (carMeshes = []) => {
		let gotAHit = { marker: false, other: false };
		const origin = directionVectorOrigin;
		const direction = directionVector;
		const length = 10;
		const ray = new Ray(origin, direction, length);
		const meshHit = ray.intersectsMeshes(carMeshes);
		return meshHit;
	}


	finishLine.track = Section.createStraight({ length: 3, physicsOptions: { friction: 1 } });
	finishLine.finished = finished;
	return finishLine;

}

