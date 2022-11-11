import Demo3D from './Demo3D.js'

let demo;

function draw() {
	try {
		const startsAt = {
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
		}
		const endsAt = {
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
		const spiral = {
			endsAt,
			rotate: demo.inputs.rotate.value,
			startsAt,
			turns: Number(demo.inputs.turns.value),
			type: 'spiral',
		}
		if (!demo.inputs.cx.classList.contains('hidden')) {
			spiral.center = {
				x: Number(demo.inputs.cx.value),
				y: Number(demo.inputs.cy.value),
				z: Number(demo.inputs.cz.value),
			}
		}
		const segment = { points: [ spiral ] };
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

function resetCenter() {
	demo.inputs.cx0.value = 10;
	demo.inputs.cy0.value = 2;
	demo.inputs.cz0.value = 0;
	demo.inputs.fx0.value = 0;
	demo.inputs.fy0.value = 0;
	demo.inputs.fz0.value = 1;
	demo.inputs.cx1.value = -10;
	demo.inputs.cy1.value = -2;
	demo.inputs.cz1.value = 0;
	demo.inputs.fx1.value = 0;
	demo.inputs.fy1.value = 0;
	demo.inputs.fz1.value = -1;
	demo.inputs.cx.value = 0;
	demo.inputs.cy.value = 0;
	demo.inputs.cz.value = 0;
	demo.inputs.rotate.selectedIndex = 0;
	demo.inputs.turns.value = 0;

	demo.panel.querySelectorAll(".centerVector").forEach((element) => element.classList.remove('hidden'));
	demo.draw()
}

function resetNoCenter(evt) {
	demo.inputs.cx0.value = 10;
	demo.inputs.cy0.value = 2;
	demo.inputs.cz0.value = 0;
	demo.inputs.fx0.value = 0;
	demo.inputs.fy0.value = 0;
	demo.inputs.fz0.value = 1;
	demo.inputs.cx1.value = 0;
	demo.inputs.cy1.value = -2;
	demo.inputs.cz1.value = 10;
	demo.inputs.fx1.value = -1;
	demo.inputs.fy1.value = 0;
	demo.inputs.fz1.value = 0;
	demo.inputs.rotate.selectedIndex = 0;
	demo.inputs.turns.value = 1;

	demo.panel.querySelectorAll(".centerVector").forEach((element) => element.classList.add('hidden'));
	if (evt) demo.draw()
}

function create() {
	demo = new Demo3D("demo-spiral", draw, changeCallback, async function() {
		demo.queryInput("resetNoCenter").addEventListener("click", resetNoCenter);
		demo.queryInput("resetCenter").addEventListener("click", resetCenter);
		resetNoCenter();
	});
	return demo;
}

export default create;
