class DebugDisplay {

	#createMesh;
	#elements;
	#track;

	constructor(debugIds, createMesh) {
		this.#elements = [];
		this.#createMesh = createMesh;
		for (let id of debugIds) {
			const elem = document.getElementById(id);
			if (!elem) throw new Error('Cannot find debug id ' + id);
			if (!elem.hasAttribute('member')) throw new Error(`Element ${id} must have a 'member' attribute`);

			this.#elements.push({ element: elem, member: elem.getAttribute('member')});
			elem.disabled = true;
			elem.checked = false;
			elem.addEventListener("click", (e) => { this.#onClick(e) });
		}
	}

	disable(state) {
		for (let elem of this.#elements) {
			elem.element.disabled = state;
		}
	}

	register(track) {
		this.#track = track;
		for (let elem of this.#elements) {
			elem.element.disabled = false;
			elem.element.checked = track[elem.member];
		}
	}

	#onClick(event) {
		if (this.#track) {
			const checkbox = event.target;
			const member = checkbox.getAttribute('member')
			this.#track[member] = checkbox.checked;
			if (checkbox.checked) this.#createMesh();
		}
	}
}

export default DebugDisplay