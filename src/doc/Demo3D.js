import Demo from './Demo.js'
import { TrackPOC } from '../js/Builder.js'
import View from '../js/View.js'

class Demo3D extends Demo {

	#engineAdapter
	#hasEntered
	#meshes
	#view

	constructor(id, engineAdapter, drawCallback, coordCallback) {
		super(id, drawCallback, coordCallback);
		this.#engineAdapter = engineAdapter;
		this.#meshes = [];

		this.root.addEventListener('mouseout', (evt) => this.#onLeave(evt));
		this.root.addEventListener('mouseover', (evt) => this.#onEnter(evt));

		this.#view = new View(engineAdapter, this.canvas);
	}

	draw() {
		for (let mesh of this.#meshes) {
			this.#engineAdapter.destroyMesh(mesh, this.#view);
		}
		this.#meshes.length = 0;

		if (!this.hasError) this.drawCallback();
	}

	produceTrack(track) {
		const trackSegments = TrackPOC(track, (u) => { return this.#engineAdapter.createVector(u) });
		for (let i = 0; i < trackSegments.length; i++) {
			const trackSegment = trackSegments[i];
			this.#meshes.push(this.#engineAdapter.createRibbon(
				`Segment${i}`,
				trackSegment.track.ribbon,
				track.closed,
				{ mass: 0 },
				this.#view));
		}
	}

	render() {
		this.#engineAdapter.render(this.#view);
	}

	#isInArea(evt) {
		const rect = this.root.getBoundingClientRect();
		return rect.left <= evt.clientX &&
			evt.clientX <= rect.right &&
			rect.top <= evt.clientY &&
			evt.clientY <= rect.bottom
	}

	#onEnter(evt) {
		if (!this.#hasEntered) {
			this.#hasEntered = true;
			document.body.style.overflowY = "hidden";
			this.#engineAdapter.enableView(this.#view);
		}
	}

	#onLeave(evt) {
		if (!this.#hasEntered) return;
		if (this.root === evt.target) {
			if (this.#isInArea(evt)) return;
		} else {
			if (this.root.contains(evt.target)) return;
		}

		this.#hasEntered = false;
		document.body.style.overflowY = "scroll";
		this.#engineAdapter.disableView(this.#view);
	}
}

export default Demo3D
