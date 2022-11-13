class BezierPoint {

	#center
	#down
	#forward
	#medianWidth
	#trackWidth
	#wallHeight

	get center() { return this.#center }
	get down() { return this.#down }
	get forward() { return this.#forward }
	get medianWidth() { return this.#medianWidth }
	get trackWidth() { return this.#trackWidth }
	get wallHeight() { return this.#wallHeight }

	constructor(values) {
		this.#center = values.center;
		this.#down = values.down;
		this.#forward = values.forward;
		this.#medianWidth = values.medianWidth;
		this.#trackWidth = values.trackWidth;
		this.#wallHeight = values.wallHeight;
	}
}

export default BezierPoint
