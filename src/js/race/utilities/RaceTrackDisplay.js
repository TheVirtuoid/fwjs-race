import { TrackPOC } from './Builder.js'

class RaceTrackDisplay {

	static #originalMember = 'Original';

	#errorDisplay;
	#families;
	#familySelector;
	#gameEngine;
	#memberSelector;
	#meshes;
	#registerCallback;
	#resetCallback;
	#start;
	#tracks;

	#track;

	constructor(gameEngine, errorDisplay, resetCallback, registerCallback) {
		this.#gameEngine = gameEngine;
		this.#errorDisplay = errorDisplay;
		this.#resetCallback = resetCallback;
		this.#registerCallback = registerCallback;

		this.#meshes = [];
	}

	createMesh() {
		this.#resetCallback();
		for (let mesh of this.#meshes) this.#gameEngine.destroyMesh(mesh);
		this.#meshes.length = 0;

		try {
			const track = this.#track.track;
			const settings = track.options ? track.options : {};

			// Produce the track segments
			this.#registerCallback(track);
			const trackSegments = TrackPOC(
				track,
				(u) => { return this.#gameEngine.createVector(u) },
				settings);

			// Save the start location
			const trackSegment = trackSegments[0];
			const leftRoad = trackSegment.track.ribbon[1];
			const rightRoad = trackSegment.track.ribbon[2];
			const p0left = leftRoad[0];
			const p0right = rightRoad[0];
			const p1left = leftRoad[1];
			const p1right = rightRoad[1];
			this.#start = {
				p0: {
					x: (p0left.x + p0right.x) / 2,
					y: (p0left.y + p0right.y) / 2,
					z: (p0left.z + p0right.z) / 2,
				},
				p1: {
					x: (p1left.x + p1right.x) / 2,
					y: (p1left.y + p1right.y) / 2,
					z: (p1left.z + p1right.z) / 2,
				},
			}

			// Produce the track
			for (let i = 0; i < trackSegments.length; i++) {
				const trackSegment = trackSegments[i];
				const physicsOptions = { ...{ mass: 0, restitution: 0, friction: 1 }, ...trackSegment.physicsOptions };
				this.#meshes.push(this.#gameEngine.createRibbon(
					`Segment${i}`,
					trackSegment.track.ribbon,
					track.closed,
					physicsOptions));
				for (let j = 0; j < trackSegment.medians.length; j++) {
					this.#meshes.push(this.#gameEngine.createRibbon(
						`Segment${i}.median${j}`,
						trackSegment.medians[j].ribbon,
						track.closed,
						{ mass: 0 }));
				}
			}
			this.#errorDisplay.clear();
		} catch (e) {
			this.#errorDisplay.showError(e);
		}
	}

	getTrackStart() { return this.#start }

	register(track) {

		// Invoke function if not an object
		if (typeof(track) === 'function') track = track();

		// Perform late initialization
		if (track.init) track.init();

		this.#track = track;

		return track;
	}

	start() {
		this.createMesh();
	}

	getSelectedTrack() {
		return this.#track.track;
	}

}

export default RaceTrackDisplay
