class NotImplementedError extends Error {
	constructor(what, other) {
		super(`${what} is not implemented${other ? ('; ' + other) : ''}`);
	}
}

export default NotImplementedError;