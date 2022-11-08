import Demo from './Demo.js'

let demo;

function coordCallback() {
}

function resetToDefaults() {
}

function init(engine) {
	demo = new Demo("demo-point", coordCallback);
	engine.addView(demo.canvas);
	//coords = helpers.initCoordFields(demo, coordCallback);
	//points = helpers.initPoints(coords);
	//demo.querySelector("#demo-point-reset").addEventListener("click", resetToDefaults);
	resetToDefaults();
}

export default init;
