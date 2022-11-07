import { setCoordFields } from './helpers.js'

const mainId = "demo-standard";
const circleYes = "demo-standard-circle-yes";
const circleNo = "demo-standard-circle-no";

const circleWeight = 5.519150244935105707435627

let drawCircle = false;
let coords;
const points = {};

function draw() {
}

function circleCallback(evt) {
	drawCircle = evt.target.id === circleYes;
	if (drawCircle) {
		points.x0.value = 10;
		points.y0.value = 0;
		points.x1.value = 10;
		points.y1.value = circleWeight;
		points.x2.value = circleWeight;
		points.y2.value = 10;
		points.x3.value = 0;
		points.y3.value = 10;
	}

	for (let coord of coords) {
		coord.disabled = drawCircle;
	}

	if (drawCircle) draw();
}

function coordCallback() {
	draw();
}

function init() {
	const demo = document.getElementById("demo-standard");

	coords = setCoordFields(demo, coordCallback);
	demo.querySelectorAll('#' + circleYes)[0].addEventListener("click", circleCallback);
	demo.querySelectorAll('#' + circleNo)[0].addEventListener("click", circleCallback);

	const mainIdDashedLength = mainId.length + 1;
	for (let coord of coords) {
		const suffix = coord.id.slice(mainIdDashedLength);
		points[suffix] = coord;
	}

	draw();
}

export default init;