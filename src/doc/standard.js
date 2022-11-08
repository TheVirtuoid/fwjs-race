import helpers from './helpers.js'
import Vector2 from '../js/Vector2.js'

const circleWeight = 5.519150244935105707435627;

const drawableCanvas = 0.8;

const bezierWidth = 1;
const bezierColor = "blue";

const labelWidth = 1;
const labelColor = "black";
const labelHorizOffset = 3;
const labelVertOffset = 3;

const pointRadius = 2;
const pointColor = "black";
const pointLabelColor = "black";

const segmentWidth = 1;
const segmentColor = "black";

const twoPI = 2 * Math.PI;

let canvas, coords, error, points;
let hasError = false;

// TODO: Convert to use built-in canvas transformations

function mapPoint(mapping, curveX, curveY) {
	const dXCurve = curveX - mapping.curveCenter.x;
	const dYCurve = curveY - mapping.curveCenter.y;
	const dXCanvas = dXCurve * mapping.canvasSpan / mapping.curveSpan;
	const dYCanvas = dYCurve * mapping.canvasSpan / mapping.curveSpan;
	return new Vector2(mapping.canvasCenter.x + dXCanvas, mapping.canvasCenter.y - dYCanvas);
}

function displayCurve(ctx, p0, p1, p2, p3) {
	ctx.lineWidth = bezierWidth;
	ctx.strokeStyle = bezierColor;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
	ctx.stroke();
}

function displayLabel(ctx, label, p, d) {
	const measure = ctx.measureText(label);
	const textWidth = measure.width;
	const textHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
	ctx.lineWidth = labelWidth;
	ctx.fillStyle = labelColor;

	if (Math.abs(d.x) >= Math.abs(d.y)) {
		ctx.fillText(label, p.x - d.x * (textWidth + labelHorizOffset), p.y + textHeight / 2);
	} else {
		ctx.fillText(label, p.x - textWidth / 2, p.y - d.y * (textHeight + labelVertOffset));
	}
}

function displayPoint(ctx, label, p0, p1, p2) {

	// Draw the point
	ctx.lineWidth = 1;
	ctx.fillStyle = pointColor;
	ctx.strokeStyle = pointColor;
	ctx.beginPath();
	ctx.arc(p0.x, p0.y, pointRadius, twoPI, false);
	ctx.fill();
	ctx.stroke();

	// Draw the label
	let d;
	if (!p2) {
		d = p0.toNormal(p1);
	} else {
		const v12 = p1.toNormal(p2);
		const v01 = p0.toNormal(p1);
		const dot = v12.dot(v01);
		d = v01.add(-dot, v12).normalize();
	}
	displayLabel(ctx, label, p0, d);
}

function displaySegment(ctx, label, p0, p1, p2) {
	ctx.lineWidth = segmentWidth;
	ctx.strokeStyle = segmentColor;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();

	const v01 = p0.toNormal(p1);
	const v02 = p0.toNormal(p2);
	const dot = v01.dot(v02);
	const d = v02.add(-dot, v01).normalize();
	displayLabel(ctx, label, p0.midpoint(p1), d);
}

function draw() {

	// Clear the canvas
	const ctx = helpers.clearCanvas(canvas);

	// Stop if there is an error
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
		canvasSpan: canvas.width * drawableCanvas,
		curveCenter: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
		curveSpan: Math.max(maxX - minX, maxY - minY),
	}
	const p0 = mapPoint(mapping, x0, y0);
	const p1 = mapPoint(mapping, x1, y1);
	const p2 = mapPoint(mapping, x2, y2);
	const p3 = mapPoint(mapping, x3, y3);

	// Draw points
	displayPoint(ctx, 'P0', p0, p1, p2);
	displayPoint(ctx, 'P1', p1, p0, p2);
	displayPoint(ctx, 'P2', p2, p1, p3);
	displayPoint(ctx, 'P3', p3, p2);

	// Draw segments
	displaySegment(ctx, 'S0', p0, p1, p2);
	displaySegment(ctx, 'S3', p3, p2, p1);

	// Draw the Bezier curve
	displayCurve(ctx, p0, p1, p2, p3);
}

function resetToCircle() {
	points.x0.value = 10;
	points.y0.value = 0;
	points.x1.value = 10;
	points.y1.value = circleWeight;
	points.x2.value = circleWeight;
	points.y2.value = 10;
	points.x3.value = 0;
	points.y3.value = 10;
	helpers.clearError(error);
	hasError = false;
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
	demo.querySelectorAll("#demo-standard-reset")[0].addEventListener("click", resetToCircle);
	resetToCircle();
}

export default init;
