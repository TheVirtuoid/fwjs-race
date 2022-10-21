export default class NoEngineSetError extends Error {
	constructor(message = 'Must invoke createDefaultEngine first') {
		super(message);
		this.name = 'NoEngineSetError';
	}
}