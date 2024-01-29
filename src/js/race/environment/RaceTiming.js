export default class RaceTiming {

	#timing;
	#timer;
	#dom;
	constructor(args = {}) {
		const { dom } = args;
		this.#dom = document.querySelector(dom);
		this.reset();
	}

	start () {
		this.#timer = setInterval(this.#increment.bind(this), 10);
	}

	stop () {
		clearInterval(this.#timer);
	}

	reset () {
		this.stop();
		this.#timing = 0;
	}

	#increment() {
		this.#timing ++;
		this.#dom.textContent = this.timingFormatted;
	}

	get timing () {
		return (this.#timing / 100).toFixed(2);
	}

	get timingFormatted () {
		const hundredths = this.#timing % 100;
		const seconds = Math.floor((this.#timing - hundredths) / 100) % 60;
		const minutes = Math.floor((this.#timing - seconds * 60 - hundredths) / 6000);
		return `${this.#format(minutes,2)}:${this.#format(seconds,2)}:${this.#format(hundredths,2)}`;
	}

	#format(number, leadingZeros) {
		const formattedNumber = `${number}`;
		return `${'0'.repeat(leadingZeros - formattedNumber.length)}${formattedNumber}`;
	}
}