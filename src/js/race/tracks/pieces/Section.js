/*
import Point from "./Point";
import Straight from "./Straight";

export default class Section {
	#points;

	constructor() {
		this.#points = []
	}

	static createPoint(args = {}) {
		return new Point();
	}

	static createStraight(args = {}) {
		return new Straight();
	}

	static createSpiral(args = {}) {
		// return new Spiral();
	}

	addPoint(point) {
		this.#points.push(point);
		return point;
	}

	toObject() {
		return {
			points: this.#points
		}
	}
}
*/

export default class Section {
	#start;
	#end;
	#type;
	#forwardWeight;
	#length;
	#endsAt;
	#meshOptions;

	constructor(args = {}) {
		const { start, end, type, forwardWeight, length, endsAt, meshOptions } = args;
		this.#start = start;
		this.#end = end;
		this.#type = type;
		this.#length = length;
		this.#forwardWeight = forwardWeight;
		this.#endsAt = endsAt;
		this.#meshOptions = meshOptions;
	}

	get start () {
		return this.#start;
	}

	get end () {
		return this.#end;
	}

	get length() {
		return this.#length;
	}

	get endsAt() {
		return this.#endsAt;
	}

	get meshOptions() {
		return this.#meshOptions;
	}

	get endPosition() {
		return {
			center: {
				x: this.end.center.x,
				y: this.end.center.y,
				z: this.end.center.z
			}
		}
	}

	get type() {
		return this.#type;
	}

	toObject() {
		return {
			type: this.#type,
			forwardWeight: this.#forwardWeight,
			startsAt: this.#start.center,
			endsAt: this.#end.center
		}
	}

	static createStraight(args) {
		const type = 'straight';
		const section = new Section({ ...args, type });
		const { start, end } = section;

		if (start && end) {
			start.forward = {
				x: end.center.x - start.center.x,
				y: end.center.y - start.center.y,
				z: end.center.z - start.center.z,
			};
			end.forward = start.forward;
		}
		return section;
	}

	static createPoint(args) {
		const section = new Section(args);
		return section;
	}
}
