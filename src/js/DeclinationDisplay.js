import NotImplementedError from './errors/NotImplementedError.js'
import spiralParser from './spiralParser.js'

class DeclinationDisplay {

	#algoSelector;
	#clearButton;
	#createMesh;
	#resetButton;
	#resetValue;
	#styleSelectorElements;
	#track;
	#valueInput;

	constructor(styleSheetTitle, styleSelector, input, createMesh) {

		this.#createMesh = createMesh;
		this.#styleSelectorElements = document.querySelectorAll(styleSelector);

		// Find the user input elements
		this.#valueInput = document.getElementById(input);
		this.#valueInput.addEventListener("change", (e) => this.#onChangeValue(e));
		this.#resetButton = document.getElementById(input + "Reset");
		this.#resetButton.addEventListener("click", (e) => this.#onReset());
		this.#clearButton = document.getElementById(input + "Clear");
		this.#clearButton.addEventListener("click", (e) => this.#onClear());
		this.#algoSelector = document.getElementById(input + "Algo");
		this.#algoSelector.addEventListener("change", (e) => this.#onChangeAlgo());

		// Add the algorithms
		for (let algo of spiralParser.getDeclinationAlgorithms()) {
			const option = document.createElement('option');
			option.text = algo;
			this.#algoSelector.add(option);
		}

		this.#track = false;
		this.#styleSelectorElements.forEach((element) => element.classList.add('hidden'));
	}

	disable(state) {
		this.#valueInput.disabled = state;
		this.#resetButton.disabled =  state;
		this.#clearButton.disabled = state;
		this.#algoSelector.disabled = state;
	}

	register(track) {
		if (track && this.#hasSpiral(track)) {
			this.#track = track;

			if (typeof(track.altDeclination) === 'string') {
				this.#resetValue = track.altDeclination;
			} else if (typeof(track.altDeclination) === 'number') {
				this.#resetValue = track.altDeclination.toString();
			} else {
				this.#resetValue = '';
			}
			this.#valueInput.value = this.#resetValue;

			let algo = -1;
			if (typeof(track.altDeclinationAlgo) === 'string') {
				for (let i = 0; i < this.#algoSelector.options.length; i++) {
					if (this.#algoSelector.options[i].text === track.altDeclinationAlgo) {
						algo = i;
						break;
					}
				}
			}
			if (algo === -1) {
				track.altDeclinationAlgo = this.#algoSelector.options[0].text;
				algo = 0;
			}
			this.#algoSelector.selectedIndex = algo;
			this.#styleSelectorElements.forEach((element) => element.classList.remove('hidden'));
		} else {
			this.#track = false;
			this.#styleSelectorElements.forEach((element) => element.classList.add('hidden'));
		}
	}

	#hasSpiral(track) {
		for (let segment of track.segments) {
			for (let point of segment.points) {
				if (point.type === 'spiral') return true;
			}
		}
		return false;
	}

	#onChangeAlgo(e) {
		const value = this.#algoSelector.value;
		if (value != this.#track.altDeclinationAlgo) {
			this.#track.altDeclinationAlgo = value;
			this.#createMesh();
		}
	}

	#onChangeValue() {
		const value = this.#valueInput.value;
		if (value != this.#track.altDeclination) {
			this.#track.altDeclination = value;
			this.#createMesh();
		}
	}

	#onClear(e) {
		//this.#valueInput.value = '';
		throw new NotImplementedError('DeclinationDisplay.onClear');
	}

	#onReset(e) {
		//this.#valueInput.value = this.#resetValue;
		throw new NotImplementedError('DeclinationDisplay.onReset');
	}
}

export default DeclinationDisplay