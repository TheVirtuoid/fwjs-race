export default class Segment {
	#sections;

	constructor() {
		this.#sections = [];
	}

	addSection(section) {
		this.#sections.push(section);
	}
}