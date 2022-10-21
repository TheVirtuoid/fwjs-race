export default class DisplayManager {

	#trackError;
	#trackErrorText;
	#disableOnError;

	constructor(args) {
		const { div, text, disableOnError = [] } = args;
		this.#trackError = document.getElementById(div);
		this.#trackErrorText = document.getElementById(text);
		this.#disableOnError = disableOnError.map((id) => document.getElementById(id));
	}

	// TODO: Put a 'hidden' class on the CSS
	clearError() {
		this.#trackError.classList.add('hidden');
		this.#disable(false);
	}

	showError(e) {
		this.#trackError.classList.remove('hidden');
		this.#trackErrorText.textContent(e.toString());
		this.#disable(true);
	}

	#disable(disable) {
		this.#disableOnError.forEach((element) => element.disabled = disable);
	}
}
