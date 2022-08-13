import {Mesh, MeshBuilder, PhysicsImpostor, Vector3} from "@babylonjs/core";

export default class Track {
	#track;

	constructor(args) {
		const { scene } = args;
		// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
		/*const ground = MeshBuilder.CreateGround("ground1", { width: 8, height: 8 }, scene);
		ground.rotation.z = Math.PI / 16;
		ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.8 }, scene);
		this.#track = ground;*/

		//set new values
		const path0 = [];
		for (let a = 0; a <= Math.PI; a += Math.PI / 4) {
			path0.push(new Vector3(4, 4 * Math.cos(a), 4 * Math.sin(a)));
		}

		const path1 = [];
		for (let a = 0; a <= Math.PI; a += Math.PI / 4) {
			path1.push(new Vector3(0, 4 * Math.cos(a), 2 + 4 * Math.sin(a)));
		}

		const path2 = [];
		for (let a = 0; a <= Math.PI; a += Math.PI / 4) {
			path2.push(new Vector3(-4, 4 * Math.cos(a), 4 * Math.sin(a)));
		}

		const myPaths2 = [path0, path1, path2];

		const ribbon = MeshBuilder.CreateRibbon("ribbon", {pathArray: myPaths2, sideOrientation: Mesh.DOUBLESIDE}, scene);
		ribbon.rotation.x = Math.PI / 2.5;
		ribbon.position.y = -2;
		ribbon.physicsImpostor = new PhysicsImpostor(ribbon, PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.8 }, scene);
	}
}