export default class Section {
	#start;
	#end;
	#type;
	#forwardWeight

	constructor(args = {}) {
		const { start, end, type, forwardWeight } = args;
		this.#start = start;
		this.#end = end;
		this.#type = type;
		this.#forwardWeight = forwardWeight;
	}

	get start () {
		return this.#start;
	}

	get end () {
		return this.#end;
	}

	toObject() {
		return {
			type: this.#type,
			forwardWeight: this.#forwardWeight,
			startsAt: this.#start.center,
			endsAt: this.#end.center
		}
	}

	endsAt() {
		return this.#end.center;
	}
}