class StaticClassError extends Error {
	constructor(className) {
		super(className + ' is a static class');
	}
}

export default StaticClassError;