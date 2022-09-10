export default class Layout {
	#tracks;
	#trackWidth;
	#wallHeight;
	#startPOI;
	#finishPOI;
	#poiMap;
	#hints;

	constructor(args = {}) {
		const {
			tracks = [],
			trackWidth = 2,
			wallHeight = .25,
			startPOI = null,
			finishPOI = null,
			poiMap = [],
			hints = new Map()
		} = args;

		this.#tracks = tracks;
		this.#trackWidth = trackWidth;
		this.#wallHeight = wallHeight;
		this.#startPOI = startPOI;
		this.#finishPOI = finishPOI;
		this.#poiMap = poiMap;
		this.#hints = hints;
	}

	get tracks () { return this.#tracks; }

	get trackWidth () { return this.#trackWidth; }

	get wallHeight () { return this.#wallHeight; }

	get startPOI () { return this.#startPOI; }

	get finishPOI () { return this.#finishPOI; }

	get poiMap () { return this.#poiMap; }

	get hints () { return this.#hints; }

}