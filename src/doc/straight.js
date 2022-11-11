import Demo3D from './Demo3D.js'

let demo;

function draw() {
	try {
		const straight = { type: 'straight' }
		const points = [];
		if (demo.inputs.useStartsAt.value === "false") {
			points.push({
				center: demo.getVector('start'),
				forward: demo.getVector('forward'),
				forwardWeight: 1,	// TODO
			});
		} else {
			straight.startsAt = demo.getVector('start')
		}
		demo.testAddNumber(straight, 'backwardWeight');
		demo.testAddVector(straight, 'endsAt');
		demo.testAddVector(straight, 'forward');
		demo.testAddNumber(straight, 'length');
		demo.testAddNumber(straight, 'startingWeight');
		points.push(straight);
		const segment = { points };
		const track = { segments: [ segment ] };
		demo.produceTrack(track);
		demo.clearError();
	} catch (e) {
		console.log(e);
		demo.setError(e);
	}
	demo.render();
}

function toggleOpposites(classA, classB) {
	demo.toggleOppositeClasses(classA, classB, () => demo.inputs[classA].value === "true");
}

function changeCallback(evt) {
	const useStartsAt = toggleOpposites('useStartsAt', 'useInherited');
	const useEndsAt = toggleOpposites('useEndsAt', 'useLength');
	const useInherited = !useStartsAt;
	const useLength = !useEndsAt;
	const useForward = useStartsAt && useLength;
	demo.showClass('useForward', useForward);
	demo.showClass('useStartsAtAndLength', useStartsAt && useLength);
	demo.showClass('useInheritedOrLength', useInherited || useLength);
	demo.showClass('useStartingWeight', useInherited && useEndsAt);
	demo.showClass('useBackwardWeight', useInherited || useForward);

	if (evt) demo.draw()
}

function resetToDefaults(evt) {
	demo.inputs.useStartsAt.selectedIndex = 1;
	demo.inputs.useEndsAt.selectedIndex = 1;

	demo.inputs.startX.value = 5;
	demo.inputs.startY.value = 5;
	demo.inputs.startZ.value = 5;
	demo.inputs.forwardX.value = -1;
	demo.inputs.forwardY.value = -1;
	demo.inputs.forwardZ.value = -1;
	demo.inputs.endsAtX.value = -5;
	demo.inputs.endsAtY.value = -5;
	demo.inputs.endsAtZ.value = -5;
	demo.inputs.startingWeight.value = 1;
	demo.inputs.length.value = 10;
	demo.inputs.backwardWeight.value = 1;

	changeCallback(evt);
}

function create() {
	demo = new Demo3D("demo-straight", draw, changeCallback, async function() {
		demo.queryInput("reset").addEventListener("click", resetToDefaults);
		resetToDefaults();
	});
	return demo;
}

export default create;
