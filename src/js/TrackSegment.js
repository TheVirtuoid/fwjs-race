import MedianRibbon from "./MedianRibbon.js"
import TrackRibbon from "./TrackRibbon.js"

class TrackSegment {

	#lanes
	#medianIndex
	#medians
	#track

	constructor() {
		this.#track = new TrackRibbon();
		this.#medians = [];
		this.#lanes = false;
	}

	get medians() { return this.#medians }
	get track() { return this.#track }

	addMedians(entryPoint, exitPoint) {
		if (entryPoint.lanes > 1 && entryPoint.lanes === exitPoint.lanes) {
			this.#lanes = entryPoint.lanes;
			this.#medianIndex = this.#medians.length;
			for (let i = 1; i < entryPoint.lanes; i++) this.#medians.push(new MedianRibbon());
		} else {
			this.#lanes = 1;
		}
	}

	push(bp, vectorFactory) {
		this.#track.push(bp, vectorFactory);
	}
}

export default TrackSegment