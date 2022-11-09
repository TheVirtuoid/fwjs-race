import Demo from './Demo.js'
import { TrackPOC } from '../js/Builder.js'

class Demo3D extends Demo {

	#engine
	#meshes

	constructor(id, engine, drawCallback, coordCallback) {
		super(id, drawCallback, coordCallback);
		this.#engine = engine;
		this.#meshes = [];
		engine.addView(this.canvas);
		this.canvas.addEventListener('blur', () => this.#onBlur());
		this.canvas.addEventListener('focus', () => this.#onFocus());
	}

	draw() {
		for (let mesh of this.#meshes) this.#engine.destroyMesh(mesh, this.canvas);
		this.#meshes.length = 0;

		if (!this.hasError) this.drawCallback();
	}

	produceTrack(track) {
		const trackSegments = TrackPOC(track, (u) => { return this.#engine.createVector(u) });
		for (let i = 0; i < trackSegments.length; i++) {
			const trackSegment = trackSegments[i];
			this.#meshes.push(this.#engine.createRibbon(
				`Segment${i}`,
				trackSegment.track.ribbon,
				track.closed,
				{ mass: 0 }));
		}
	}

	render() {
		this.#engine.render(this.canvas);
	}

	#onBlur() {
		this.#engine.disableView(this.canvas);
	}

	#onFocus() {
		this.#engine.enableView(this.canvas);
	}
}

export default Demo3D
