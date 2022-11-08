import helpers from './helpers.js'

let canvas, coords, error, points;
let hasError = false;

function coordCallback() {
}

function reset() {
}

function init(engine) {
	const demo = document.getElementById("demo-point");
	error = helpers.initError(demo);
	canvas = helpers.initCanvas(demo);
	engine.addView(canvas);
	//coords = helpers.initCoordFields(demo, coordCallback);
	//points = helpers.initPoints(coords);
	//demo.querySelector("#demo-point-reset").addEventListener("click", reset);
	reset();
}

export default init;
