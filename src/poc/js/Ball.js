import {Vector3} from "@babylonjs/core";

class Ball {

	// Allow the use to override
	static diameter = .25;
	static height = 1;
	static inset = .8;
	static weight = 2;

	#gameEngine;
	#mesh;
	#tracks;

	constructor(gameEngine, tracks, id) {
		this.#gameEngine = gameEngine;
		this.#tracks = tracks;
		document.getElementById(id).addEventListener('click', () => { this.#drop() });
	}

	destroy() {
		this.#mesh = this.#gameEngine.destroyMesh(this.#mesh);
	}

	#drop() {
		this.destroy();
		const {p0, p1} = this.#tracks.getTrackStart();
		const t = Ball.inset;
		const olt = 1 - t;
		this.#mesh = this.#gameEngine.createSphere(
			"ball",
			{ diameter: Ball.diameter },
			{ mass: Ball.weight });
		this.#mesh.position.x = p0.x * t + p1.x * olt;
		this.#mesh.position.y = p0.y * t + p0.y * olt + Ball.height;
		this.#mesh.position.z = p0.z * t + p1.z * olt;
		const { x, y, z } = this.#mesh.position;
		// this.#gameEngine.camera.position(new Vector3(x + 2, y + 2, z + 2));
		this.#gameEngine.camera.lockedTarget = this.#mesh;
	}
}

export default Ball