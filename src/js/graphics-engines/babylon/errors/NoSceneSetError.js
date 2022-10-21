export default class NoSceneSetError extends Error {
	constructor(message = 'Must invoke createScene first') {
		super(message);
		this.name = 'NoSceneSetError';
	}
}