import Demo3D from './Demo3D.js'

let demo;

function draw() {
}

function coordCallback() {
	demo.draw()
}

function resetToDefaults(evt) {
	if (evt) demo.draw()
}

async function init() {
	demo = new Demo3D("demo-straight", draw, coordCallback);
	await demo.initialize(() => async function() {
		//demo.queryInput("reset").addEventListener("click", resetToDefaults);
		resetToDefaults();
	});
	return demo;
}

export default init;
