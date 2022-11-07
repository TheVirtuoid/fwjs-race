import helpers from './helpers.js'

const circleYes = "demo-standard-circle-yes";
const circleNo = "demo-standard-circle-no";

const circleWeight = 5.519150244935105707435627;

const pointRadius = 2;
const pointColor = "black";
const pointLabelColor = "black";

const bezierWidth = 1;
const bezierColor = "blue";

let canvas, coords, error, points;
let drawCircle = false;
let hasError = false;

// TODO: Convert to use built-in canvas transformations

function mapPoint(mapping, curveX, curveY) {
	const dXCurve = curveX - mapping.curveCenter.x;
	const dYCurve = curveY - mapping.curveCenter.y;
	const dXCanvas = dXCurve * mapping.canvasSpan / mapping.curveSpan;
	const dYCanvas = dYCurve * mapping.canvasSpan / mapping.curveSpan;
	return { x: mapping.canvasCenter.x + dXCanvas, y: mapping.canvasCenter.y - dYCanvas };
}

function displayCircle() {
}

function displayCurve(ctx, mapping, x0, y0, x1, y1, x2, y2, x3, y3) {
	const p0 = mapPoint(mapping, x0, y0);
	const p1 = mapPoint(mapping, x1, y1);
	const p2 = mapPoint(mapping, x2, y2);
	const p3 = mapPoint(mapping, x3, y3);

	ctx.lineWidth = bezierWidth;
	ctx.strokeStyle = bezierColor;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
	ctx.stroke();
}

function displayPoint(label, x, y, mapping, x1, y1, x2, y2) {
}

function draw() {

	// Clear the canvas
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = window.getComputedStyle(canvas).backgroundColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	if (hasError) return;

	// Get the coordinates of the points
	const x0 = Number(points.x0.value);
	const x1 = Number(points.x1.value);
	const x2 = Number(points.x2.value);
	const x3 = Number(points.x3.value);
	const y0 = Number(points.y0.value);
	const y1 = Number(points.y1.value);
	const y2 = Number(points.y2.value);
	const y3 = Number(points.y3.value);

	// Determine mapping
	const minX = Math.min(x0, x1, x2, x3);
	const maxX = Math.max(x0, x1, x2, x3);
	const minY = Math.min(y0, y1, y2, y3);
	const maxY = Math.max(y0, y1, y2, y3);
	const mapping = {
		canvasCenter: { x: canvas.width / 2, y: canvas.height / 2 },
		canvasSpan: canvas.width * 0.9,
		curveCenter: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
		curveSpan: Math.max(maxX - minX, maxY - minY),
	}

	displayPoint('P0', x0, y0, mapping, x1, y1);
	displayPoint('P1', x1, y1, mapping, x0, y0, x2, y2);
	displayPoint('P2', x2, y2, mapping, x1, y1, x3, y3);
	displayPoint('P3', x3, y3, mapping, x2, y2);

	displayCurve(ctx, mapping, x0, y0, x1, y1, x2, y2, x3, y3);

	if (drawCircle) displayCircle(mapping, x0, y0, x3, y3);
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
		helpers.clearError(error);
	}

	for (let coord of coords) {
		coord.disabled = drawCircle;
	}

	draw();
}

function coordCallback() {
	hasError = helpers.checkForCoincidentalPoints(points, 4, error);
	draw();
}

function init() {
	const demo = document.getElementById("demo-standard");
	error = helpers.initError(demo);
	canvas = helpers.initCanvas(demo);
	coords = helpers.initCoordFields(demo, coordCallback);
	points = helpers.initPoints(coords);
	demo.querySelectorAll('#' + circleYes)[0].addEventListener("click", circleCallback);
	demo.querySelectorAll('#' + circleNo)[0].addEventListener("click", circleCallback);
	draw();
}

export default init;