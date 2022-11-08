import Demo3D from './Demo3D.js'

let demo;

function draw() {
}

function coordCallback() {
	demo.draw()
}

function resetToDefaults() {
	demo.draw()
}

function init(engine) {
	demo = new Demo3D("demo-spiral", engine, draw, coordCallback);
	//demo.queryInput("reset").addEventListener("click", resetToDefaults);
	resetToDefaults();
	return demo;
}

export default init;
