import Demo3D from './Demo3D.js'

let demo;

function showClass(name, show) {
	let addRemove = show ? 'remove' : 'add';
	demo.panel.querySelectorAll('.' + name).forEach((element) => element.classList[addRemove]('hidden'));
}

function toggleOpposites(classA, classB) {
	const value = demo.inputs[classA].value === "true";
	showClass(classA, value);
	showClass(classB, !value);
	return value;
}

function getNumber(name) { return Number(demo.inputs[name].value) }

function getVector(name) {
	return {
		x: getNumber(name + 'X'),
		y: getNumber(name + 'Y'),
		z: getNumber(name + 'Z'),
	}
}

function testAddNumber(o, name) {
	if (!demo.inputs[name].classList.contains('hidden')) o[name] = getNumber(name);
}

function testAddVector(o, name) {
	if (!demo.inputs[name + 'X'].classList.contains('hidden')) o[name] = getVector(name);
}

function draw() {
	try {
		const straight = { type: 'straight' }
		const points = [];
		if (demo.inputs.useStartsAt.value === "false") {
			points.push({
				center: getVector('start'),
				forward: getVector('forward'),
				forwardWeight: 1,	// TODO
			});
		} else {
			straight.startsAt = getVector('start')
		}
		testAddNumber(straight, 'backwardWeight');
		testAddVector(straight, 'endsAt');
		testAddVector(straight, 'forward');
		testAddNumber(straight, 'length');
		testAddNumber(straight, 'startingWeight');
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

function changeCallback(evt) {
	const useStartsAt = toggleOpposites('useStartsAt', 'useInherited');
	const useEndsAt = toggleOpposites('useEndsAt', 'useLength');
	const useInherited = !useStartsAt;
	const useLength = !useEndsAt;
	const useForward = useStartsAt && useLength;
	showClass('useForward', useForward);
	showClass('useStartsAtAndLength', useStartsAt && useLength);
	showClass('useInheritedOrLength', useInherited || useLength);
	showClass('useStartingWeight', useInherited && useEndsAt);
	showClass('useBackwardWeight', useInherited || useForward);

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
