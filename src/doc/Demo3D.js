import Demo from './Demo.js'
import { TrackPOC } from '../js/Builder.js'
import View from '../js/View.js'

class Demo3D extends Demo {

	#engineAdapter
	#meshes
	#view

	constructor(id, engineAdapter, drawCallback, coordCallback) {
		super(id, drawCallback, coordCallback);
		this.#engineAdapter = engineAdapter;
		this.#meshes = [];

		this.canvas.addEventListener('mouseout', () => this.#onLeaveCanvas());
		this.canvas.addEventListener('mouseover', () => this.#onEnterCanvas());

		//this.#engineAdapter.setCanvas(this.canvas);
		this.#view = new View(engineAdapter, this.canvas);
	}

	draw() {
		for (let mesh of this.#meshes) this.#engineAdapter.destroyMesh(mesh, this.canvas);
		//for (let mesh of this.#meshes) this.#engineAdapter.destroyMesh(mesh);
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
				{ mass: 0 }),
				this.#view);
		}
	}

	render() {
		this.#engineAdapter.render(this.#view);
		//this.#engineAdapter.render();
	}

	#onLeaveCanvas() {
		document.body.style.overflowY = "scroll";
		this.#engineAdapter.disableView(this.#view);
	}

	#onEnterCanvas() {
		document.body.style.overflowY = "hidden";
		this.#engineAdapter.enableView(this.#view);
	}
}

export default Demo3D
