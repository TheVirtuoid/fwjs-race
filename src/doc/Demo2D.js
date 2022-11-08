import Demo from './Demo.js'

class Demo2D extends Demo {

	constructor(id, coordCallback) {
		super(id, coordCallback);
	}

	draw(drawer) {
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (!this.hasError) drawer(ctx);
	}
}

export default Demo2D
