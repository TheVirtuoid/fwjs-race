import {Vector3} from "@babylonjs/core";

export default class CarController {

	#car
	#gameEngine;
	#mesh;
	#tracks;
	#gate;

	constructor(args = {}) {
		const { gameEngine, tracks, car, gate } = args;
		this.#gameEngine = gameEngine;
		this.#tracks = tracks;
		this.#car = car;
		this.#gate = gate;
	}

	placeInGate() {
		this.#car.junk();
		const {p0, p1} = this.#tracks.getTrackStart();
		// const t = Ball.inset;
		const t = 0;
		const olt = 1 - t;
		const x = p0.x * t + p1.x * olt;
		const y = p0.y * t + p0.y * olt - 1;
		const z = p0.z * t + p1.z * olt;

		this.#car.build({ position: new Vector3( x, y, z ), scene: this.#gameEngine.scene });
		console.log(this.#car.wheelBase.getBoundingInfo());
		console.log(this.#car.wheelBase.getHierarchyBoundingVectors());
		this.#gameEngine.camera.lockedTarget = this.#car.chassis;
	}
}