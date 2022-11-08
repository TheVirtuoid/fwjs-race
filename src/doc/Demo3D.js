import Demo from './Demo.js'

class Demo3D extends Demo {

	#engine
	#meshes

	constructor(id, engine, drawCallback, coordCallback) {
		super(id, drawCallback, coordCallback);
		this.#engine = engine;
		this.#meshes = [];
		engine.addView(this.canvas);
	}

	draw() {
		for (let mesh of this.#meshes) this.#engine.destroyMesh(mesh);
		this.#meshes.length = 0;

		if (!this.hasError) this.drawCallback();
	}
}

export default Demo3D
