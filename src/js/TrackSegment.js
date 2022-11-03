import MedianRibbon from "./MedianRibbon.js"
import TrackRibbon from "./TrackRibbon.js"

class TrackSegment {

	#medianIndex
	#medians
	#sectionMedians
	#track

	constructor() {
		this.#track = new TrackRibbon();
		this.#medians = [];
		this.#sectionMedians = 0;
	}

	get medians() { return this.#medians }
	get track() { return this.#track }

	addMedians(entryPoint, exitPoint) {
		if (entryPoint.lanes > 1 && entryPoint.lanes === exitPoint.lanes) {
			this.#sectionMedians = entryPoint.lanes - 1;
			this.#medianIndex = this.#medians.length;
			for (let i = 0; i < this.#sectionMedians; i++) {
				this.#medians.push(new MedianRibbon(i, this.#sectionMedians));
			}
		} else {
			this.#sectionMedians = 0;
		}
	}

	push(bp, vectorFactory) {
		this.#track.push(bp, vectorFactory);
		for (let i = 0; i < this.#sectionMedians; i++) {
			this.#medians[this.#medianIndex + i].push(bp, vectorFactory);
		}
	}
}

export default TrackSegment