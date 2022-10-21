export default class TrackRegistrationError extends Error {
	constructor(message = 'Track Registration Error') {
		super(message);
		this.name = "TrackRegistrationError";
	}
}