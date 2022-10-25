export default class CarOperation {

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
		const y = p0.y * t + p0.y * olt + this.#car.height;
		const z = p0.z * t + p1.z * olt;

		this.#car.build({ position: { x, y, z }});
		this.#gameEngine.camera.lockedTarget = this.#car.chassis;
	}
}