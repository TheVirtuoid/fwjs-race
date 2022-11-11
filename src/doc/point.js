import Demo3D from './Demo3D.js'

let demo;

function draw() {
	try {
		const p0 = {
			center: demo.getVector('c0'),
			forward: demo.getVector('f0'),
			forwardWeight: demo.getNumber('w0'),
		}
		const p1 = {
			backwardWeight: demo.getNumber('w1'),
			center: demo.getVector('c1'),
			forward: demo.getVector('f1'),
		}
		const segment = { points: [ p0, p1 ] };
		const track = { segments: [ segment ] };
		console.log(segment.points);
		demo.produceTrack(track);
		demo.clearError();
	} catch (e) {
		console.log(e);
		demo.setError(e);
	}
	demo.render();
}

function changeCallback() {
	demo.draw()
}

function resetToDefaults(evt) {
	demo.inputs.c0X.value = 2;
	demo.inputs.c0Y.value = 6;
	demo.inputs.c0Z.value = 0;
	demo.inputs.f0X.value = -1;
	demo.inputs.f0Y.value = 0;
	demo.inputs.f0Z.value = 0;
	demo.inputs.w0.value = 4;
	demo.inputs.c1X.value = -2;
	demo.inputs.c1Y.value = -6;
	demo.inputs.c1Z.value = 0;
	demo.inputs.f1X.value = -1;
	demo.inputs.f1Y.value = 0;
	demo.inputs.f1Z.value = 0;
	demo.inputs.w1.value = 4;
	if (evt) demo.draw()
}

function create() {
	demo = new Demo3D("demo-point", draw, changeCallback, async function() {
		demo.queryInput("reset").addEventListener("click", resetToDefaults);
		resetToDefaults();
	});
	return demo;
}

export default create;
