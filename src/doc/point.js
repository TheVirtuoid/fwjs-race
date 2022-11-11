import Demo3D from './Demo3D.js'

let demo;

function draw() {
	try {
		const p0 = {
			center: {
				x: Number(demo.inputs.cx0.value),
				y: Number(demo.inputs.cy0.value),
				z: Number(demo.inputs.cz0.value),
			},
			forward: {
				x: Number(demo.inputs.fx0.value),
				y: Number(demo.inputs.fy0.value),
				z: Number(demo.inputs.fz0.value),
			},
			forwardWeight: Number(demo.inputs.w0.value),
		}
		const p1 = {
			backwardWeight: Number(demo.inputs.w1.value),
			center: {
				x: Number(demo.inputs.cx1.value),
				y: Number(demo.inputs.cy1.value),
				z: Number(demo.inputs.cz1.value),
			},
			forward: {
				x: Number(demo.inputs.fx1.value),
				y: Number(demo.inputs.fy1.value),
				z: Number(demo.inputs.fz1.value),
			},
		}
		const segment = { points: [ p0, p1 ] };
		const track = { segments: [ segment ] };
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
	demo.inputs.cx0.value = 2;
	demo.inputs.cy0.value = 6;
	demo.inputs.cz0.value = 2;
	demo.inputs.fx0.value = 1;
	demo.inputs.fy0.value = 0;
	demo.inputs.fz0.value = 0;
	demo.inputs.w0.value = 1;
	demo.inputs.cx1.value = -2;
	demo.inputs.cy1.value = -6;
	demo.inputs.cz1.value = -4;
	demo.inputs.fx1.value = 1;
	demo.inputs.fy1.value = 0;
	demo.inputs.fz1.value = 0;
	demo.inputs.w1.value = 1;
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
