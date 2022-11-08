import Demo from './Demo.js'

class Demo2D extends Demo {

	constructor(id, drawCallback, coordCallback) {
		super(id, drawCallback, coordCallback);
	}

	draw() {
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (!this.hasError) this.drawCallback(ctx);
	}
}

export default Demo2D
