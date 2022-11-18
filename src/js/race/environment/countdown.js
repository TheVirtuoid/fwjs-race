export default (args = {}) => {

	let index = 0;
	const dom = document.getElementById('countdown')
	const start = () => {
		return new Promise((resolve, reject) => {
			index = 0;
			const lights = dom.querySelectorAll('span');
			lights[index].classList.remove('off');
			const finalLight = lights.length - 1;
			const timer = setInterval(() => {
				lights.forEach((light) => light.classList.add('off'));
				index++;
				lights[index].classList.remove('off');
				if (index === finalLight) {
					clearInterval(timer);
					resolve(true);
				}
			}, 1000)
		});
	}

	const off = () => {
		dom.classList.add('hidden');
		return Promise.resolve();
	}

	return { start, off };
}