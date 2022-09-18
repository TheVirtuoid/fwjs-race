import ControlPoint from "./ControlPoint";

export default class Track {
	constructor() {
		throw new Error('Track cannot be instantiated. It is a static class.');
	}

	static createControlPoint (params) {
		return new ControlPoint(params)
	}

	static createEndPoint() {};

	static createSegment() {};

	static createLayout() {};

	static createTrack() {};

}