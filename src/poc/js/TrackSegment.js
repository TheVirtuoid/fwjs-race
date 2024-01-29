import bezier from './bezier.js'
import MedianRibbon from './MedianRibbon.js'
import TrackRibbon from './TrackRibbon.js'

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

	addMedians(entryPoint, exitPoint, vectorFactory) {

		// Determine the number of medians this section will have. If
		// the entry and exit points disagree on their number of lanes,
		// produce no medians.
		const desiredMedians = entryPoint.lanes > 1 && entryPoint.lanes === exitPoint.lanes ?
			(entryPoint.lanes - 1) : 0;

		// If the number of medians does not change, do nothing
		if (desiredMedians === this.#sectionMedians) { }

		// If there were medians before, complete that section's medians
		else if (this.#sectionMedians > 0) {
			const bp = {
				center: entryPoint.center,
				down: bezier.getDown(entryPoint),
				forward: entryPoint.forward,
				medianWidth: entryPoint.medianWidth,
				trackWidth: entryPoint.trackWidth,
				wallHeight: entryPoint.wallHeight,
			};
			this.push(bp, vectorFactory);
		}

		// Otherwise this section starts new medians, add them
		else {
			this.#medianIndex = this.#medians.length;
			for (let i = 0; i < desiredMedians; i++) {
				this.#medians.push(new MedianRibbon(i, desiredMedians));
			}
		}

		// Remember the number of desired medians
		this.#sectionMedians = desiredMedians;
	}

	push(bp, vectorFactory) {
		this.#track.push(bp, vectorFactory);
		for (let i = 0; i < this.#sectionMedians; i++) {
			this.#medians[this.#medianIndex + i].push(bp, vectorFactory);
		}
	}
}

export default TrackSegment