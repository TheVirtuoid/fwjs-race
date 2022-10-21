export default class NoCanvasSetError extends Error {
	constructor(message = 'Must invoke setCanvas first') {
		super(message);
		this.name = 'NoCanvasSetError';
	}
}