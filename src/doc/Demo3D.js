import Demo from './Demo.js'

class Demo3D extends Demo {

	#meshes

	constructor(id, coordCallback) {
		super(id, coordCallback);
	}

	draw(drawer) {
		for (let mesh of this.#meshes) this.#engine.destroyMesh(mesh);
		this.#meshes.length = 0;

		if (!this.hasError) drawer();
	}
}

export default Demo2D
