import Demo2D from './Demo2D.js'
import Vector2 from '../poc/js/Vector2.js'

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

let demo;

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

function displaySegment(ctx, label, dash, p0, p1, p2) {
	ctx.lineWidth = segmentWidth;
	ctx.strokeStyle = segmentColor;
	ctx.setLineDash(dash ? [10, 5] : []);
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();

	if (label && label.length > 0) {
		const v01 = p0.toNormal(p1);
		const v02 = p0.toNormal(p2);
		const dot = v01.dot(v02);
		const d = v02.add(-dot, v01).normalize();
		displayLabel(ctx, label, p0.midpoint(p1), d);
	}
}

function draw(ctx) {

	// Get the coordinates of the points
	let p0 = new Vector2(Number(demo.inputs.x0.value), Number(demo.inputs.y0.value));
	const d0 = new Vector2(Number(demo.inputs.dx0.value), Number(demo.inputs.dy0.value)).normalize();
	const w0 = Number(demo.inputs.w0.value);
	let p1 = p0.add(w0, d0);
	let t0 = p0.add(1, d0);

	let p3 = new Vector2(Number(demo.inputs.x3.value), Number(demo.inputs.y3.value));
	const d3 = new Vector2(Number(demo.inputs.dx3.value), Number(demo.inputs.dy3.value)).normalize();
	const w3 = Number(demo.inputs.w3.value);
	let p2 = p3.add(-w3, d3);
	let t3 = p3.add(1, d3);

	// Determine mapping
	const minX = Math.min(p0.x, p1.x, p2.x, p3.x, t0.x, t3.x);
	const maxX = Math.max(p0.x, p1.x, p2.x, p3.x, t0.x, t3.x);
	const minY = Math.min(p0.y, p1.y, p2.y, p3.y, t0.y, t3.y);
	const maxY = Math.max(p0.y, p1.y, p2.y, p3.y, t0.y, t3.y);
	const mapping = {
		canvasCenter: { x: demo.width / 2, y: demo.height / 2 },
		canvasSpan: demo.width * drawableCanvas,
		curveCenter: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
		curveSpan: Math.max(maxX - minX, maxY - minY),
	}

	// Transform points into canvas coordinates
	p0 = mapPoint(mapping, p0.x, p0.y);
	p1 = mapPoint(mapping, p1.x, p1.y);
	p2 = mapPoint(mapping, p2.x, p2.y);
	p3 = mapPoint(mapping, p3.x, p3.y);
	t0 = mapPoint(mapping, t0.x, t0.y);
	t3 = mapPoint(mapping, t3.x, t3.y);

	// Draw points
	displayPoint(ctx, 'P0', p0, p1);
	displayPoint(ctx, 'P1', p1, p0, p2);
	displayPoint(ctx, 'P2', p2, p1, p3);
	displayPoint(ctx, 'P3', p3, p2);
	displayPoint(ctx, 'f0', t0, p2);
	displayPoint(ctx, 'f3', t3, p2);

	// Draw segments
	displaySegment(ctx, 'S0', true, p0, p1, p2);
	displaySegment(ctx, 'S3', true, p3, p2, p1);
	displaySegment(ctx, '', false, p0, p1, p2);
	displaySegment(ctx, '', false, p3, p2, p1);

	// Draw the Bezier curve
	displayCurve(ctx, p0, p1, p2, p3);
}

function resetToCircle(evt) {

	demo.inputs.x0.value = 10;
	demo.inputs.y0.value = 0;
	demo.inputs.x3.value = 0;
	demo.inputs.y3.value = 10;

	demo.inputs.dx0.value = 0;
	demo.inputs.dy0.value = 1;
	demo.inputs.w0.value = circleWeight;

	demo.inputs.dx3.value = -1;
	demo.inputs.dy3.value = 0;
	demo.inputs.w3.value = circleWeight;

	demo.clearError();
	if (evt) demo.draw();
}

function coordCallback() {
	demo.draw();
}

function create() {
	demo = new Demo2D("demo-tangentWeight", draw, coordCallback);
	demo.queryInput("reset").addEventListener("click", resetToCircle);
	resetToCircle();
	return demo;
}

export default create;
