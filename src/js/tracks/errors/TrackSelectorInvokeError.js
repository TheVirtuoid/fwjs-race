export default class TrackSelectorInvokeError extends Error {
	constructor(message = 'Must invoke setSelectors first') {
		super(message);
		this.name = 'TrackSelectorInvokeError';
	}
}