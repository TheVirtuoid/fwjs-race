export default class Venue {
	constructor() {
		throw new Error('"Venue" is a static class.');
	}

	/**
	 * creates a new Venue. Should include layout, scene, cameras, lights, models, etc.
	 */
	static create() {}

	/**
	 * Loads an existing Venue. Probably in JSON format.
	 */
	static load() {}

	/**
	 * Creates a blank Venue
	 */
	static createVenue() {};

	/**
	 * Creates a new Layout
	 */
	static createLayout() {}

	/**
	 * Creates a new Scene
	 */
	static createScene() {}

	/**
	 * Creates a new Camera
	 */
	static createCamera() {}

	/**
	 * Creates a new Light
	 */
	static createLight() {}

	/**
	 * Creates a new Model
	 */
	static createModel() {}

	/**
	 * Loads a layout
	 */
	static loadLayout() {}

	/**
	 * Loads a scene
	 */
	static loadScene() {}

	/**
	 * Loads a camera
	 */
	static loadCamera() {}

	/**
	 * Loads a light
	 */
	static loadLight() {}

	/**
	 * Loads a model
	 */
	static loadModel() {}
}