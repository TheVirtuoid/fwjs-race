import Demo3D from './Demo3D.js'

let demo;

function draw() {
	try {
		const startsAt = {
			center: demo.getVector('c0'),
			forward: demo.getVector('f0'),
		}
		const endsAt = {
			center: demo.getVector('c1'),
			forward: demo.getVector('f1'),
		}
		const spiral = {
			endsAt,
			rotate: demo.inputs.rotate.value,
			startsAt,
			turns: demo.getNumber('turns'),
			type: 'spiral',
		}
		demo.testAddVector(spiral, 'center');
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
	demo.inputs.c0X.value = 10;
	demo.inputs.c0Y.value = 2;
	demo.inputs.c0Z.value = 0;
	demo.inputs.f0X.value = 0;
	demo.inputs.f0Y.value = 0;
	demo.inputs.f0Z.value = 1;
	demo.inputs.c1X.value = -10;
	demo.inputs.c1Y.value = -2;
	demo.inputs.c1Z.value = 0;
	demo.inputs.f1X.value = 0;
	demo.inputs.f1Y.value = 0;
	demo.inputs.f1Z.value = -1;
	demo.inputs.centerX.value = 0;
	demo.inputs.centerY.value = 0;
	demo.inputs.centerZ.value = 0;
	demo.inputs.rotate.selectedIndex = 0;
	demo.inputs.turns.value = 0;

	demo.showClass('centerVector', true);

	demo.draw()
}

function resetNoCenter(evt) {
	demo.inputs.c0X.value = 10;
	demo.inputs.c0Y.value = 2;
	demo.inputs.c0Z.value = 0;
	demo.inputs.f0X.value = 0;
	demo.inputs.f0Y.value = 0;
	demo.inputs.f0Z.value = 1;
	demo.inputs.c1Z.value = 0;
	demo.inputs.c1Y.value = -2;
	demo.inputs.c1Z.value = 10;
	demo.inputs.f1X.value = -1;
	demo.inputs.f1Y.value = 0;
	demo.inputs.f1Z.value = 0;
	demo.inputs.rotate.selectedIndex = 0;
	demo.inputs.turns.value = 1;

	demo.showClass('centerVector', false);

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
