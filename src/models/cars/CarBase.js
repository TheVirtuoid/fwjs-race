import {
	Color3,
	HingeJoint,
	Vector3
} from "@babylonjs/core";

/*
	height = y-axis
	depth = side-to-side axis
	width = front-to-back axis
 */
import { carDefaults, wheelParameters } from './carBase-defaults';
import Wheel from "./parts/Wheel";
import Transmission from "./parts/Transmission";
import Body from "./parts/Body";


export default class CarBase {

	// car parts
	#transmission;
	#body;
	#wheels;

	// properties
	#width;
	#depth;
	#height;
	#position;
	#name;
	#color;

	// misc.
	#scene;
	#built;

	#slot;

	#model;

	#telemetryMesh;

	#modelSize;
	#type;

	// public
	BodyFactory;

	static Load(scene) {
		return Promise.resolve(null);
	}

	constructor(args = {}) {
		const { slot, scene, position, name, color, model = null, type = 'CarBase', BodyFactory = Body }= args;
		this.#scene = scene;
		this.#position = position;
		this.#name = name;
		this.#model = model;
		const { red, green, blue } = this.#hashToColor(color);
		this.#color = new Color3(red, green, blue);
		this.#slot = slot;
		this.#type = type;
		this.#built = false;
		this.#telemetryMesh = null;
		this.BodyFactory = BodyFactory;
		this.setModelSize();
	}

	setModelSize(boundingVectors) {
		let { width, height, depth } = carDefaults;
		this.#modelSize = { width, height, depth };
	}

	build (args = {}) {
		if (!this.#built) {
			const { scene: inScene, position: inPosition, name: inName, color: inColor } = args;
			this.#scene = inScene ?? this.#scene;
			this.#position = inPosition ?? this.#position;
			this.#name = inName ?? this.#name;
			this.#color = inColor ?? this.#color;
			const [scene, position, name, color, model] = [this.#scene, this.#position, this.#name, this.#color, this.#model];

			let transmission = this.#addTransmission({ scene, position, name });
			let wheels = wheelParameters.map((wheel) => {
				const { wheelName, pivot } = wheel;
				return this.#addWheel({ name, scene, position, wheelName, pivot });
			});
			let body = this.#addBody({ name, scene, position, color, model });
			transmission.mesh.addChild(body.mesh);
			// transmission.mesh.addChild(body.colliderMesh);

			this.#setPhysics({ transmission, wheels, body });
			this.#transmission = transmission;
			this.#wheels = wheels;
			this.#scene = scene;
			this.#body = body;
			this.#model = model;
			if (!this.#telemetryMesh) {
				this.#telemetryMesh = this.#body.mesh;
			}
			this.#built = true;
		}
	}

	adjustRotation(forwardVector, radians) {
		const { x, y, z } = forwardVector;
		this.#transmission.mesh.rotate(new Vector3(x, y, z), radians);
	}

	junk () {
		if (this.#built) {
			this.#wheels.forEach((wheel) => {
				wheel.junk(this.#scene);
			});
			this.#body.junk(this.#scene);
			this.#transmission.junk(this.#scene);
			this.#wheels = [];
			this.#model = null;
			this.#built = false;
		}
	}

	get body () {
		return this.#body;
	}

	get height () {
		return this.#height;
	}

	get width () {
		return this.#width;
	}

	get transmission() {
		return this.#transmission;
	}

	get depth () {
		return this.#depth;
	}

	get name () {
		return this.#name;
	}

	get position () {
		return this.#transmission.position;
	}

	get slot () {
		return this.#slot;
	}

	get color () {
		return this.#color;
	}

	get model () {
		return this.#model;
	}

	get telemetryMesh () {
		return this.#telemetryMesh;
	}

	get wheels () {
		return this.#wheels;
	}

	get modelSize() {
		return this.#modelSize;
	}

	set modelSize(args) {
		this.#modelSize = args;
	}

	get type() {
		return this.#type;
	}

	setTelemetryMesh(mesh) {
		this.#telemetryMesh = mesh;
	}

	#scaleVector3(vector, scale) {
		const x = vector.x * scale;
		const y = vector.y * scale;
		const z = vector.z * scale;
		return new Vector3(x, y, z);
	}

	// the transmission was the old axle
	#addTransmission(args = {}) {
		const transmission = new Transmission(args);
		return transmission.build(args);
	}

	#addWheel(args = {}) {
		const wheel = new Wheel(args);
		return wheel.build(args);
	}

	#addBody(args = {}){
		const body = new this.BodyFactory(args);
		return body.build(args);
	}

	#setPhysics(args = {}) {
		const { transmission, wheels, body } = args;
		body.applyPhysics();
		transmission.applyPhysics();
		wheels.forEach((wheel) => {
			wheel.applyPhysics();
			const joint = new HingeJoint({
				mainPivot: wheel.pivot,
				connectedPivot: new Vector3(0, 0, 0),
				mainAxis: new Vector3(0, 1, 0),
				connectedAxis: new Vector3(0, 1, 0),
				nativeParams: {}
			});
			transmission.mesh.physicsImpostor.addJoint(wheel.mesh.physicsImpostor, joint);
		});
	}

	#hashToColor(hash) {
		const red = parseInt(hash.substring(1, 3), 16) / 256;
		const green = parseInt(hash.substring(3, 5), 16) / 256;
		const blue = parseInt(hash.substring(5, 7), 16) / 256;
		return { red, green, blue };
	}

}
