import {Vector3} from "@babylonjs/core";

export const carDefaults = {
	height: 2,
	depth: 4,
	width: 8
}

const widthAdjust = carDefaults.width * .35;
const depthAdjust = carDefaults.depth *.45;
// x = forward/backward of the wheels

export const wheelParameters = [
	{ wheelName: 'rightFront', pivot: new Vector3(widthAdjust, depthAdjust, 0) },
	{ wheelName: 'rightRear', pivot: new Vector3(-widthAdjust, depthAdjust, 0) },
	{ wheelName: 'leftFront', pivot: new Vector3(+widthAdjust, -depthAdjust, 0)},
	{ wheelName: 'leftRear', pivot: new Vector3(-widthAdjust, -depthAdjust, 0) }
];
