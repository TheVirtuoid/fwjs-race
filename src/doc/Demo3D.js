import Demo from './Demo.js'

import BabylonAdapter from '../poc/js/BabylonAdapter.js'
import { TrackPOC } from '../poc/js/Builder.js'

class Demo3D extends Demo {

	#engineAdapter
	#initializationCallback
	#meshes
	#scene

	constructor(id, drawCallback, coordCallback, initializationCallback) {
		super(id, drawCallback, coordCallback);
		this.#initializationCallback = initializationCallback;
		this.canvas.addEventListener('mouseout', (evt) => this.#onLeave(evt));
		this.canvas.addEventListener('mouseover', (evt) => this.#onEnter(evt));
	}

	draw() {
		for (let mesh of this.#meshes) {
			this.#engineAdapter.destroyMesh(mesh);
		}
		this.#meshes.length = 0;

		if (!this.hasError) this.drawCallback();
	}

	getNumber(name) { return Number(this.inputs[name].value) }

	getVector(name) {
		return {
			x: this.getNumber(name + 'X'),
			y: this.getNumber(name + 'Y'),
			z: this.getNumber(name + 'Z'),
		}
	}

	async initialize() {

		// Create the adapter and set the canvas
		this.#meshes = [];
		this.#engineAdapter = new BabylonAdapter();
		this.#engineAdapter.setCanvas(this.canvas);

		// Queue the adapter and domain initializers
		const promiseEngine = this.#asyncEngineCreation();
		const promiseCallback = this.#initializationCallback();
		const promisePhysics = BabylonAdapter.initializePhysics();

		// Wait on the engine initialization and then physics initialization
		const engine = await promiseEngine;
		if (!engine) throw new Error('engine should not be null.');
		await promisePhysics;

		// Wait on the domain initialization
		await promiseCallback;

		// Start the render loop and create the scene
		this.#engineAdapter.startRenderLoop();
		this.#scene = this.#engineAdapter.createScene();
		this.#engineAdapter.ready();
	}

	produceTrack(track) {
		const trackSegments = TrackPOC(track, (u) => { return this.#engineAdapter.createVector(u) });
		for (let i = 0; i < trackSegments.length; i++) {
			const trackSegment = trackSegments[i];
			this.#meshes.push(this.#engineAdapter.createRibbon(
				`${this.canvas.id}-segment${i}`,
				trackSegment.track.ribbon,
				track.closed,
				{ mass: 0 }));
		}
	}

	render() {
		this.#engineAdapter.render();
	}

	showClass(name, show) {
		let addRemove = show ? 'remove' : 'add';
		this.panel.querySelectorAll('.' + name).forEach(
			(element) => element.classList[addRemove]('hidden')
		);
	}

	testAddNumber(o, name) {
		if (!this.inputs[name].classList.contains('hidden')) o[name] = this.getNumber(name);
	}

	testAddVector(o, name) {
		if (!this.inputs[name + 'X'].classList.contains('hidden')) o[name] = this.getVector(name);
	}

	toggleOppositeClasses(classA, classB, test) {
		const value = test();
		this.showClass(classA, value);
		this.showClass(classB, !value);
		return value;
	}

	#asyncEngineCreation() {
		try {
			return this.#engineAdapter.createDefaultEngine();
		} catch(e) {
			console.log("the available createEngine function failed. Creating the default engine instead");
			return this.#engineAdapter.createDefaultEngine();
		}
	}

	#isInArea(evt) {
		const rect = this.root.getBoundingClientRect();
		return rect.left <= evt.clientX &&
			evt.clientX <= rect.right &&
			rect.top <= evt.clientY &&
			evt.clientY <= rect.bottom
	}

	#onEnter(evt) {
		document.body.style.overflowY = "hidden";
	}

	#onLeave(evt) {
		document.body.style.overflowY = "scroll";
	}
}

export default Demo3D
