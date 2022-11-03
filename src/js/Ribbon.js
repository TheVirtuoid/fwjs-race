class Ribbon {

	#ribbon

	constructor() {
		this.#ribbon = [ [], [], [], [] ]
	}

	get ribbon() { return this.#ribbon }

	push(bp, vectorFactory) {
		const left = bp.forward.cross(bp.down);
		const wall = bp.down.scale(-bp.wallHeight);
		const edgeDistance = bp.trackWidth / 2;
		const leftEdge = bp.center.add(edgeDistance, left);
		const rightEdge = bp.center.add(-edgeDistance, left);
		this.#ribbon[0].push(vectorFactory(leftEdge.add(1, wall)));
		this.#ribbon[1].push(vectorFactory(leftEdge));
		this.#ribbon[2].push(vectorFactory(rightEdge));
		this.#ribbon[3].push(vectorFactory(rightEdge.add(1, wall)));
	}
}

export default Ribbon