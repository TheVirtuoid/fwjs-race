export default (args = {}) => {

	let index = 0;
	const dom = document.getElementById('countdown')
	const start = () => {
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
				setTimeout(() => {
					dom.classList.add('hidden');
				}, 3000);
			}
		}, 1000)
	}

	return { start };
}