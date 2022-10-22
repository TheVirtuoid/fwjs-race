import spiralParser from './spiralParser.js'

class DeclinationDisplay {

	#algoSelector;
	#clearButton;
	#resetButton;
	#resetValue;
	#rule;
	#track;
	#valueInput;

	constructor(styleSheetTitle, styleSelector, input) {

		// Find the style sheet
		let targetSheet;
		for (let sheet of document.styleSheets) {
			if (styleSheetTitle === sheet.title) {
				targetSheet = sheet;
				break;
			}
		}
		if (!targetSheet) throw new Error('Cannot find stylesheet ' + styleSheetTitle);

		// Find the rule
		for (let rule of targetSheet.cssRules) {
			if (rule instanceof CSSStyleRule && rule.selectorText === styleSelector) {
				this.#rule = rule;
				break;
			}
		}
		if (!this.#rule) throw new Error('Cannot find selector ' + styleSelector);

		// Find the user input elements
		this.#valueInput = document.getElementById(input);
		this.#valueInput.addEventListener("change", (e) => this.#onChangeValue(e));
		this.#resetButton = document.getElementById(input + "Reset");
		this.#resetButton.addEventListener("click", (e) => this.#onReset(e));
		this.#clearButton = document.getElementById(input + "Clear");
		this.#clearButton.addEventListener("click", (e) => this.#onClear(e));
		this.#algoSelector = document.getElementById(input + "Algo");
		this.#algoSelector.addEventListener("change", (e) => this.#onChangeAlgo(e));

		// Add the algorithms
		for (let algo of spiralParser.getDeclinationAlgorithms()) {
			const option = document.createElement('option');
			option.text = algo;
			this.#algoSelector.add(option);
		}

		this.#track = false;
		this.#rule.style.display = "none";
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

			console.log(typeof(track.altDeclination));
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
			this.#rule.style.display = "block";
		} else {
			this.#track = false;
			this.#rule.style.display = "none";
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
		console.log(e);
		throw new Error('Not implemented');
	}

	#onChangeValue(e) {
		const value = this.#valueInput.value;
		if (value != this.#track.altDeclination) {
			this.#track.altDeclination = value;
			tracks.createMesh();
		}
	}

	#onClear(e) {
		this.#valueInput.value = '';
	}

	#onReset(e) {
		this.#valueInput.value = this.#resetValue;
	}
}

export default DeclinationDisplay