export const normalizeDegrees = (value) => {
	let angle = value % 360;
	if (angle > 180) return angle - 360;
	if (angle <= -180) return angle + 360;
	return angle;
}