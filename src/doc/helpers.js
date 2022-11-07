function setCoordFields(owner, changeCallback) {
	const coords = owner.querySelectorAll(".coord");
	for (let coord of coords) {
		coord.max = 10;
		coord.min = -10;
		coord.step = 0.001;
		coord.maxLength = 7;
		if (changeCallback) coord.addEventListener("change", changeCallback);
	}
	return coords;
}

export { setCoordFields };