export default class CarListItem {
	#car;
	#listItem;
	#service;

	constructor(args = {}) {
		const { car, service } = args;
		this.#car = car;
		this.#service = service;
	}

	get car () {
		return this.#car;
	}

	get listItem () {
		if (!this.#listItem) {
			const li = document.createElement('li');
			li.setAttribute('draggable', 'true');
			li.id = this.#car.id;
			li.appendChild(this.#car.carImage);
			li.addEventListener('dragstart', this.#handleDragStart.bind(this));
			this.#listItem = li;
		}
		return this.#listItem;
	}

	hide () {
		if (this.#listItem) {
			this.#listItem.classList.add('hidden');
		}
	}

	show () {
		if (this.#listItem) {
			this.#listItem.prepend(this.#car.carImage);
			this.#listItem.classList.remove('hidden');
		}
	}

	append (svg) {
		if (this.#listItem) {
			while (this.#listItem.firstChild) {
				this.#listItem.removeChild(this.#listItem.firstChild);
			}
			this.#listItem.appendChild(svg);
		}
	}

	#handleDragStart (event) {
		event.dataTransfer.setData('text/plain', event.target.id);
		event.dataTransfer.dropEffect = 'move';
	}
}