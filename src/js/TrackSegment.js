import TrackRibbon from "./TrackRibbon.js"

class TrackSegment {

	#medians
	#track

	constructor() {
		this.#track = new TrackRibbon();
		this.#medians = [];
	}

	get medians() { return this.#medians }
	get track() { return this.#track }

	push(bp, vectorFactory) {
		this.#track.push(bp, vectorFactory);
	}
}

export default TrackSegment