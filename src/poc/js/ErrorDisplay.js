class ErrorDisplay {

	#divElement;
	#textElement;
	#disableElements;
	#disableCallbacks;

	constructor(divId, textId, disableIds, disableCallbacks) {
		this.#divElement = document.getElementById(divId);
		this.#textElement = document.getElementById(textId);
		this.#disableElements = [];
		for (let id of typeof(disableIds) === 'string' ? [ disableIds ] : disableIds) {
			this.#disableElements.push(document.getElementById(id));
		}
		this.#disableCallbacks = typeof(disableCallbacks) === 'function' ?
			[ disableCallbacks ] : disableCallbacks;
	}

	clear() {
		this.#divElement.style.display = "none";
		this.#disable(false);
	}

	showError(e) {
		console.log(e);
		this.#divElement.style.display = "block";
		this.#textElement.innerText = e.toString();
		this.#disable(true);
	}

	#disable(disable) {
		for (let element of this.#disableElements) {
			element.disabled = disable;
		}
		for (let callback of this.#disableCallbacks) {
			callback(disable)
		}
	}
}

export default ErrorDisplay