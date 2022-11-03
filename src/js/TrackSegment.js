import Ribbon from "./Ribbon.js"

class TrackSegment {

	#medians
	#track

	constructor() {
		this.#track = new Ribbon();
		this.#medians = [];
	}

	get medians() { return this.#medians }
	get track() { return this.#track }

	push(bp, vectorFactory) {
		this.#track.push(bp, vectorFactory);
	}
}

export default TrackSegment