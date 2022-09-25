import {
	Axis,
	Color3,
	CreateBoxVertexData,
	CreateCylinderVertexData,
	Mesh, PhysicsImpostor, Space, StandardMaterial,
	Vector3
} from "@babylonjs/core";

export default class Car {
	#body;
	#roof;
	#wheels;
	#id;
	#color;
	#vertexData;
	#physicsAnchor;
	#wheelPositions = {
		driverFront: [-.65, -2.2, -.5],
		driverRear: [.65, -2.2, -.5],
		passengerFront: [-.65, -2.2, .5],
		passengerRear: [.65, -2.2, .5]
	}
	#wheelNames = ['driverFront', 'driverRear', 'passengerFront', 'passengerRear'];

	constructor(args) {
		const { id, color } = args;
		this.#id = id;
		this.#color = color;
		this.#wheels = {};
		this.#vertexData = {
			body: null,
			wheels: {}
		};
		this.#wheelNames.forEach((wheelName) => {
			this.#wheels[wheelName] = null;
			this.#vertexData.wheels[wheelName] = null;
		});
		this.#initialize();
	}

	get velocity () {
		const { x, y, z } = this.#physicsAnchor.physicsImpostor.getLinearVelocity();
		return Math.abs(x + y + z);
	}

	turnTires () {
		if (this.velocity > 0.5) {
			this.#wheelNames.forEach((wheelName) => {
				this.#wheels[wheelName].rotate(Axis.Y, -.5, Space.LOCAL);
			});
		}
	}

	#initialize() {
		const color = this.#color.toColor4(1);
		this.#vertexData.body = CreateBoxVertexData({
			height: .5,
			width: 2,
			depth: 1,
			faceColors: [color, color, color, color, color, color]
		});
		const black = Color3.Black().toColor4(1);
		this.#wheelNames.forEach((wheelName) => {
			this.#vertexData.wheels[wheelName] = CreateCylinderVertexData({
				height: .15,
				diameter: .5,
				faceColors: [black, black, black]
			});
		});
	}

	#positionWheel(args) {
		const { wheelName, scene, position } = args;
		const [ x, y, z ] = this.#wheelPositions[wheelName];
		const wheel = new Mesh(`${this.#id}-wheel-${wheelName}`, scene, this.#body);
		const tire = new StandardMaterial(`${this.#id}-tire-mat`, scene);
		tire.wireframe = true;
		wheel.position = position.clone();
		wheel.position.y += y;
		wheel.position.z += z;
		wheel.position.x += x;
		wheel.rotation.x = Math.PI / 2;
		wheel.material = tire;
		return wheel;
	}

	build (args) {

		const { scene = null, position = new Vector3(0, 0, 0) } = args;
		this.#body = new Mesh(`${this.#id}-body`);
		this.#vertexData.body.applyToMesh(this.#body, scene);
		this.#body.position = position;
		this.#body.physicsImpostor = new PhysicsImpostor(this.#body, PhysicsImpostor.BoxImpostor, { mass: 0 }, scene );

		this.#wheelNames.forEach((wheelName) => {
			const wheel = this.#positionWheel({ wheelName, scene, position });
			this.#vertexData.wheels[wheelName].applyToMesh(wheel, scene);
			wheel.physicsImpostor = new PhysicsImpostor(wheel, PhysicsImpostor.CylinderImpostor, { mass: 0 }, scene);
			this.#wheels[wheelName] = wheel;
		});

		this.#physicsAnchor = new Mesh(`${this.#id}-physics-anchor`, scene);
		this.#physicsAnchor.addChild(this.#body);
		this.#physicsAnchor.physicsImpostor = new PhysicsImpostor(this.#physicsAnchor, PhysicsImpostor.NoImpostor, { mass: 3, friction: 0 }, scene);
	}
}