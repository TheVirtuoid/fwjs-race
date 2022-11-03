import Ribbon from './Ribbon.js'

class MedianRibbon extends Ribbon {

	#medianIndex
	#totalMedians

	constructor(medianIndex, totalMedians) {
		super(4);
		this.#medianIndex = medianIndex;
		this.#totalMedians = totalMedians;
	}

	push(bp, vectorFactory) {
		const left = bp.forward.cross(bp.down);
		const wall = bp.down.scale(-bp.wallHeight);
		const edgeDistance = bp.trackWidth / 2;
		const leftRoadEdge = bp.center.add(edgeDistance, left);

		const lane = this.#medianIndex + 1;
		const lanes = this.#totalMedians + 1;
		const widthLessMedians = bp.trackWidth - this.#totalMedians * bp.medianWidth;
		const laneWidth = widthLessMedians / lanes;
		const inset = lane * laneWidth + this.#medianIndex * bp.medianWidth;

		const leftMedianRoadEdge = leftEdge.add(-inset, left);
		const leftMedianWallTop = leftMedianRoadEdge.add(1, wall);
		this.ribbon[0].push(vectorFactory(leftMedianRoadEdge));
		this.ribbon[1].push(vectorFactory(leftMedianWallTop));
		this.ribbon[2].push(vectorFactory(leftMedianWallTop.add(-bp.medianWidth, left)));
		this.ribbon[3].push(vectorFactory(leftMedianRoadEdge.add(-bp.medianWidth, left)));
	}
}

export default MedianRibbon