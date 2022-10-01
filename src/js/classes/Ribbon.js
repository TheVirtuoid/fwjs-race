import Vector from "./Vector";
/*

 A ribbon is an array of four arrays of vectors representing the [0] left wall
 top, [1] left road edge, [2] right road edge, and [3] right wall top.

 */

export default class Ribbon {
	static addRibbonSlice(ribbon, bp, vectorFactory) {
		const left = Vector.cross(bp.forward, bp.down);
		const wall = Vector.multiply(-bp.wallHeight, bp.down);
		const edgeDistance = bp.trackWidth / 2;
		const leftEdge = Vector.add(bp.center, edgeDistance, left);
		const rightEdge = Vector.add(bp.center, -edgeDistance, left);
		ribbon[0].push(vectorFactory(Vector.add(leftEdge, 1, wall)));
		ribbon[1].push(vectorFactory(leftEdge));
		ribbon[2].push(vectorFactory(rightEdge));
		ribbon[3].push(vectorFactory(Vector.add(rightEdge, 1, wall)));
	}

	static createRibbon() {
		return [ [], [], [], [] ];
	}
}