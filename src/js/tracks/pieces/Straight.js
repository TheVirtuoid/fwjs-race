import Section from "./Section";

export default class Straight extends Section {

	constructor(args = {}) {
		const type = 'straight';
		super({ ...args, type });

		this.start.forward = {
			x: this.end.center.x - this.start.center.x,
			y: this.end.center.y - this.start.center.y,
			z: this.end.center.z - this.start.center.z,
		};
		this.end.forward = this.start.forward;
	}
}