class Ribbon {

	#ribbon

	constructor(count) {
		this.#ribbon = [];
		for (let i = 0; i < count; i++) this.#ribbon.push([]);
	}

	get ribbon() { return this.#ribbon }
}

export default Ribbon