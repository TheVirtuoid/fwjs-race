import {Axis, Color3, Mesh, MeshBuilder, Space, StandardMaterial, Vector3, Vector4} from "@babylonjs/core";

export default class Basic {
	#material = new StandardMaterial("body_mat");
	#scene;

	#scene;
	car;

	constuctor({ parameters }) {
		const { scene } = parameters;
		const bodyMaterial = new StandardMaterial("body_mat", scene);
		bodyMaterial.diffuseColor = new Color3(1.0, 0.25, 0.25);
		bodyMaterial.backFaceCulling = false;

		const side = [
				new Vector3(-6.5, 1.5, -2),
				new Vector3(2.5, 1.5, -2),
				new Vector3(3.5, 0.5, -2),
				new Vector3(-9.5, 0.5, -2)
		];
		side.push(side[0]);			// finishes off the trapezium

		// extrusion path
		const extrudePath = [
				new Vector3(0, 0, 0),
				new Vector3(0, 0, 4)
		];

		const body = MeshBuilder.ExtrudeShape("body", {
			shape: side,
			path: extrudePath,
			cap: Mesh.CAP_ALL
		}, scene);

		body.material = bodyMaterial;

		// wheels
		const wheelMaterial = new StandardMaterial("wheel_mat", scene);
		wheelMaterial.diffuseColor = new Color3(0, 0, 0);
		const faceColors = [];
		faceColors[1] = new Color3(0, 0, 0);
		const faceUV = [];
		faceUV[0] = new Vector4(0, 0, 1, 1);
		faceUV[2] = new Vector4(0, 0, 1, 1);
		const wheelFI = MeshBuilder.CreateCylinder("wheelFI", {
			diameter: 3,
			height: 1,
			tessellation: 24,
			faceColors,
			faceUV
		}, scene);
		wheelFI.material = wheelMaterial;
		wheelFI.rotate(Axis.X, Math.PI/2, Space.WORLD);

		// other wheels
		const wheelFO = wheelFI.createInstance("FO");
		wheelFO.parent = body;
		wheelFO.position = new Vector3(0, 0, 1.8);

		const wheelRI = wheelFI.createInstance("RI");
		wheelRI.parent = body;
		wheelRI.position = new Vector3(0, 0, -2.8);

		const wheelRO = wheelFI.createInstance("RO");
		wheelRO.parent = body;
		wheelRO.position = new Vector3(0, 0, 2.8);

		wheelFI.parent = body;
		wheelFI.position = new Vector3(0, 0, -1.8);

		// see car documentaion playground.babylonjs.com/#102TBD#31 for pivot point

		this.#scene = scene;
		this.car = body;

	}


}