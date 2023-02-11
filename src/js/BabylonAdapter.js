import {
	AmmoJSPlugin, ArcRotateCamera,
	ArcRotateCameraPointersInput,	// TODO: Remove when finished debugging
	Color3,
	Engine,
	HemisphericLight,
	Mesh, MeshBuilder,
	PhysicsImpostor,
	Scene, StandardMaterial,
	Vector3, VertexData,
} from "@babylonjs/core";

import ammo from "ammo.js";
import is from './is.js'

class SingleSceneManager {

	#canvas
	#scene

	get canvas() { return this.#canvas }
	get scene() { return this.#scene }

	constructor(canvas) {
		this.#canvas = is.string(canvas) ? document.getElementById(canvas) : canvas;
	}

	create(createScene, registerView) {
		this.#scene = createScene(this.#canvas);
		return this.#scene;
	}

	render() {
		this.#scene.render();
	}
}

const errorSiblingViewCannotHaveSibling = 'Cannot use a view as a sibling if it also has a sibling'
const errorMustInvokeAddViewForSibling = 'Must invoke addView for sibling'

class ViewManager {

	#views

	get canvas() { return this.#views[0].canvas }
	get scene() { return this.#views[0].scene }

	constructor(view) {
		this.#views = [ view ];
	}

	addView(view) {
		this.#views.push(view);
	}

	create(createScene, registerView, createDummyScene) {

		// Create scenes for root views
		for (let view of this.#views) {
			if (view.isPrimary) {
				view.scene = createScene(view.canvas);
				view.view = registerView(view.canvas, view.scene);
				view.scene.detachControl();
			}
		}

		// Patch in the siblings
		for (let view of this.#views) {
			if (view.isSecondary) {
				const sibling = this.#findPrimary(view.sibling);
				if (sibling.isSecondary) throw new Error(errorSiblingViewCannotHaveSibling);
				view.scene = sibling.scene;
				view.view = registerView(view.canvas, view.scene, true);
				view.scene.detachControl();
			}
		}

		return this.#views[0].scene;
	}

	static renderAlgo = 2;

	render(engine) {
		if (ViewManager.renderAlgo === 1) {
			if (!engine.activeView || !engine.activeView.camera) {
				this.#views[0].scene.render();
			} else {
				for (let view of this.#views) {
					if (engine.activeView.target === view.view) {
						view.scene.render();
						return;
					}
				}
				throw new Error('engine.activeView.target does not match any views');
			}
		}

		else if (ViewManager.renderAlgo === 2) {
			for (let view of this.#views) {
				if (view.isPrimary) view.scene.render();
			}
		}
	}

	#findPrimary(view) {
		for (let v of this.#views) {
			if (v.canvas === view.sibling) return v;
		}
		throw new Error(errorMustInvokeAddViewForSibling);
	}
}

const errorCannotMultipleInvokeCreate = 'Cannot invoke createScene or createViews twice'
const errorCannotMultipleInvokeSetCanvas = 'Cannot invoke setCanvas twice'
const errorCannotMix = 'Cannot mix setCanvas and addView'
const errorMustInvokeCreate = 'Must invoke createScene or createViews first'
const errorMustInvokeCreateEngine = 'Must invoke createDefaultEngine first'
const errorMustInvokeCreateViews = 'Must invoke createViews first'
const errorMustInvokeSetAdd = 'Must invoke setCanvas or addView first'

// Build options
const boSingleRibbon = 0;
const boSeparateRibbons = boSingleRibbon + 1;
const boDepthMesh = boSeparateRibbons + 1;

const botSingleRibbon = 'Single ribbon';
const botSeparateRibbons = 'Separate ribbons';
const botDepthMesh = 'Mesh with depth';

class BabylonAdaptor {

	#engine;
	#ready;
	#sceneManager;
	#materials = [];
	
	get buildOptions() {
		return [
			{ key: boSingleRibbon, text: botSingleRibbon },
			{ key: boSeparateRibbons, text: botSeparateRibbons },
			{ key: boDepthMesh, text: botDepthMesh },
		];
	}
	
	get #trackMaterial() {
		const scene = this.#sceneManager.scene;
		if (!(scene in this.#materials)) this.#materials[scene] = [];
		if ("track" in this.#materials[scene]) return this.#materials[scene]["track"];
		const mat = new StandardMaterial(scene);
		mat.alpha = 1;
		mat.diffuseColor = new Color3(.1, .1, .1);
		this.#materials[scene]["track"] = mat;
		return mat;
	}
	
	get #wallMaterial() {
		const scene = this.#sceneManager.scene;
		if (!(scene in this.#materials)) this.#materials[scene] = [];
		if ("wall" in this.#materials[scene]) return this.#materials[scene]["wall"];
		const mat = new StandardMaterial(scene);
		mat.alpha = 1;
		mat.diffuseColor = new Color3(211 / 255, 211 / 255, 211 / 255);
		this.#materials[scene]["wall"] = mat;
		return mat;
	}

	addView(view) {
		if (!this.#sceneManager) {
			this.#sceneManager = new ViewManager(view);
		} else if (this.#sceneManager instanceof ViewManager) {
			this.#sceneManager.addView(view);
		} else {
			throw new Error(errorCannotMix);
		}
	}

	createDefaultEngine() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);

		this.#engine = new Engine(
			this.#sceneManager.canvas,
			true,
			{
				preserveDrawingBuffer: true,
				stencil: true,
				disableWebGL2Support: false
			});
		return this.#engine;
	}
	
	createMedian(name, ribbon, closed, buildOption, meshOptions, view) {
		// Because it is coming from HTML, buildOption is a string
		if (buildOption == boDepthMesh) {
			return [ this.createRibbon(name, ribbon, closed, meshOptions, view) ];
		} else if (buildOption == boSeparateRibbons) {
			return [ this.createRibbon(name, ribbon, closed, meshOptions, view) ];
		} else if (buildOption == boSingleRibbon) {
			return [ this.createRibbon(name, ribbon, closed, meshOptions, view) ];
		} else {
			throw new Error(buildOption);
		}
	}

	createRibbon(name, ribbon, closed, meshOptions, view) {
		if (view) {
			if (!view.scene) throw new Error(errorMustInvokeCreateViews);
		} else {
			if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
			if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		}

		const scene = view ? view.scene : this.#sceneManager.scene;
		const mesh = MeshBuilder.CreateRibbon(
			name,
			{
				pathArray: ribbon,
				sideOrientation: Mesh.DOUBLESIDE,
				closePath: closed,
			},
			scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.MeshImpostor, meshOptions, scene);
		return mesh;
	}

	createScene() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (this.#sceneManager.scene) throw new Error(errorCannotMultipleInvokeCreate);

		return this.#sceneManager.create(
			(canvas) => { return this.#createScene(canvas) },
			(canvas, scene, generateCamera) => {
				if (generateCamera) {
					const name = BabylonAdaptor.#createUniqueName(canvas);
					const camera = BabylonAdaptor.#createCamera(canvas, scene, name);
					return this.#engine.registerView(canvas, camera);
				} else {
					return this.#engine.registerView(canvas);
				}
			},
			() => { return new Scene(this.#engine) });
	}

	createScenes() { this.createScene() }

	createSphere(name, sphereOptions, impostorOptions) {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (this.#sceneManager.scene) throw new Error(errorCannotMultipleInvokeCreate);

		const scene = this.#sceneManager.scene;
		const mesh = MeshBuilder.CreateSphere(name, sphereOptions, scene);
		mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.SphereImpostor, impostorOptions, scene);
		return mesh;
	}
	
	createTrack(name, ribbon, closed, buildOption, meshOptions, view) {

		// Because it is coming from HTML, buildOption is a string
		if (buildOption == boDepthMesh) {
			return this.#createTrackMesh(name, ribbon, closed, buildOption, meshOptions, view);
		} else if (buildOption == boSeparateRibbons) {
			const leftWall = this.createRibbon(name + " left wall", [ ribbon[0], ribbon[1] ], closed, meshOptions, view);
			const rightWall = this.createRibbon(name + " right wall", [ ribbon[2], ribbon[3] ], closed, meshOptions, view);
			const track = this.createRibbon(name + " track surface", [ ribbon[1], ribbon[2] ], closed, meshOptions, view);
			leftWall.material = this.#wallMaterial;
			rightWall.material = this.#wallMaterial;
			track.material = this.#trackMaterial;
			return [ leftWall, rightWall, track ];
		} else if (buildOption == boSingleRibbon) {
			return [ this.createRibbon(name, ribbon, closed, meshOptions, view) ];
			
		} else {
			throw new Error("Invalid build option " + buildOption);
		}
	}

	#createTrackMesh(name, ribbon, closed, buildOption, meshOptions, view) {
		// See https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/custom/custom
		
		// Set up the meshes
		const scene = view ? view.scene : this.#sceneManager.scene;
		const positions = [];
		const leftWallMesh = new Mesh(name + ' left wall', scene);
		const rightWallMesh = new Mesh(name + ' right wall', scene);
		const trackMesh = new Mesh(name + ' track', scene);
		const leftWallIndices = [];
		const trackIndices = [];
		const rightWallIndices = [];
			
		// HACK: Use a fraction of the wall height to determine the depth
		const toWallTop = ribbon[1][0].subtract(ribbon[0][0]);
		const depth = toWallTop.length() / 10;
			
		// Define a function to copy vertices into positions
		const copyVertex = function(v) {
			positions.push(v.x);
			positions.push(v.y);
			positions.push(v.z);
			return v;
		};
			
		// Define a function to push a rectangle into indices
		const pushRectangle = function(indices, clockwise0, clockwise1, clockwise2, clockwise3) {
			indices.push(clockwise0);
			indices.push(clockwise1);
			indices.push(clockwise2);
			indices.push(clockwise0);
			indices.push(clockwise2);
			indices.push(clockwise3);
		}
		
		// Define a function to push a wall cap
		// NOTE: The vertices clockwise3, middle, clockwise0 must themselves be in clockwise order
		const pushWallEnd = function(indices, middle, clockwise0, clockwise1, clockwise2, clockwise3) {
			indices.push(middle);
			indices.push(clockwise0);
			indices.push(clockwise1);
			indices.push(middle);
			indices.push(clockwise1);
			indices.push(clockwise2);
			indices.push(middle);
			indices.push(clockwise2);
			indices.push(clockwise3);
		}
			
		// Define readability constants
		const verticesPerSlice = 10;
			
		const oLeftWallInnerTop = 0;			// Offset of ...
		const oLeftWallInnerMiddle = 1;
		const oLeftWallInnerBottom = 5;
		const oLeftWallOuterTop = 4;
		const oLeftWallOuterBottom = 6;
			
		const oRightWallInnerTop = 3;
		const oRightWallInnerMiddle = 2;
		const oRightWallInnerBottom = 7;
		const oRightWallOuterTop = 9;
		const oRightWallOuterBottom = 8;
			
		const oTrackLeftTop = 1;
		const oTrackLeftBottom = 5;
		const oTrackRightTop = 2;
		const oTrackRightBottom = 7;
		
		const fillLeftWall = function(curSlice, prevSlice) {
			pushRectangle(leftWallIndices,			// Top
				prevSlice + oLeftWallInnerTop,
				prevSlice + oLeftWallOuterTop,
				curSlice + oLeftWallOuterTop,
				curSlice + oLeftWallInnerTop);
			pushRectangle(leftWallIndices,			// Upper inner
				curSlice + oLeftWallInnerMiddle,
				prevSlice + oLeftWallInnerMiddle,
				prevSlice + oLeftWallInnerTop,
				curSlice + oLeftWallInnerTop);
			pushRectangle(leftWallIndices,			// Lower inner
				curSlice + oLeftWallInnerBottom,
				prevSlice + oLeftWallInnerBottom,
				prevSlice + oLeftWallInnerMiddle,
				curSlice + oLeftWallInnerMiddle);
			pushRectangle(leftWallIndices,			// Bottom
				curSlice + oLeftWallInnerBottom,
				curSlice + oLeftWallOuterBottom,
				prevSlice + oLeftWallOuterBottom,
				prevSlice + oLeftWallInnerBottom);
			pushRectangle(leftWallIndices,			// Outer
				prevSlice + oLeftWallOuterBottom,
				curSlice + oLeftWallOuterBottom,
				curSlice + oLeftWallOuterTop,
				prevSlice + oLeftWallOuterTop);
		}
		
		const fillRightWall = function(curSlice, prevSlice) {
			pushRectangle(rightWallIndices,			// Top
				prevSlice + oRightWallOuterTop,
				prevSlice + oRightWallInnerTop,
				curSlice + oRightWallInnerTop,
				curSlice + oRightWallOuterTop);
			pushRectangle(rightWallIndices,			// Upper inner
				prevSlice + oRightWallInnerMiddle,
				curSlice + oRightWallInnerMiddle,
				curSlice + oRightWallInnerTop,
				prevSlice + oRightWallInnerTop);
			pushRectangle(rightWallIndices,			// Lower inner
				prevSlice + oRightWallInnerBottom,
				curSlice + oRightWallInnerBottom,
				curSlice + oRightWallInnerMiddle,
				prevSlice + oRightWallInnerMiddle);
			pushRectangle(rightWallIndices,			// Bottom
				curSlice + oRightWallOuterBottom,
				curSlice + oRightWallInnerBottom,
				prevSlice + oRightWallInnerBottom,
				prevSlice + oRightWallOuterBottom);
			pushRectangle(rightWallIndices,			// Outer
				curSlice + oRightWallOuterBottom,
				prevSlice + oRightWallOuterBottom,
				prevSlice + oRightWallOuterTop,
				curSlice + oRightWallOuterTop);
		}
		
		const fillTrack = function(curSlice, prevSlice) {
			pushRectangle(trackIndices,				// Top
				prevSlice + oTrackRightTop,
				prevSlice + oTrackLeftTop,
				curSlice + oTrackLeftTop,
				curSlice + oTrackRightTop);
			pushRectangle(trackIndices,				// Left side
				prevSlice + oTrackLeftBottom,
				curSlice + oTrackLeftBottom,
				curSlice + oTrackLeftTop,
				prevSlice + oTrackLeftTop);
			pushRectangle(trackIndices,				// Right side
				curSlice + oTrackRightBottom,
				prevSlice + oTrackRightBottom,
				prevSlice + oTrackRightTop,
				curSlice + oTrackRightTop);
			pushRectangle(trackIndices,				// Bottom
				curSlice + oTrackRightBottom,
				curSlice + oTrackLeftBottom,
				prevSlice + oTrackLeftBottom,
				prevSlice + oTrackRightBottom);
		}
			
		// Loop over each slice in the ribbon
		for (let slice = 0; slice < ribbon[0].length; slice++) {
				
			// For convenience, get the slice vertices
			const vLeftWallTop = ribbon[0][slice];
			const vLeftTrackTop = ribbon[1][slice];
			const vRightTrackTop = ribbon[2][slice];
			const vRightWallTop = ribbon[3][slice];
				
			// Compute the left and down vectors for the slice
			const vLeft = vLeftTrackTop.subtract(vRightTrackTop).normalize().scaleInPlace(depth);
			const vDown = vLeftTrackTop.subtract(vLeftWallTop).normalize().scaleInPlace(depth);
				
			// Push the vertices into the position array
			// NOTE: The wall meshes have inner middle vertices so that they fit snuggly against
			// the track mesh
			copyVertex(vLeftWallTop);						// 0: Left inner wall top
			copyVertex(vLeftTrackTop);						// 1: Left track top, left inner wall middle
			copyVertex(vRightTrackTop);						// 2: Right track top, right inner wall middle
			copyVertex(vRightWallTop);						// 3: Right inner wall top
			copyVertex(vLeftWallTop.add(vLeft));			// 4: Left outer wall top
			const vLeftTrackBottom =
				copyVertex(vLeftTrackTop.add(vDown));		// 5: Left track bottom, left inner wall bottom
			copyVertex(vLeftTrackBottom.add(vLeft));		// 6: Left outer wall bottom
			const vRightTrackBottom =
				copyVertex(vRightTrackTop.add(vDown));		// 7: Right track bottom, right inner wall bottom
			copyVertex(vRightTrackBottom.subtract(vLeft));	// 8: Right outer wall bottom
			copyVertex(vRightWallTop.subtract(vLeft));		// 9: Right outer wall top
				
			// If this is not the first slice, create triangles to back to the
			// previous level
			if (slice > 0) {
					
				// Determine where the two slices start
				const curSlice = slice * verticesPerSlice;
				const prevSlice = curSlice - verticesPerSlice;
				
				// Fill in the meshes
				fillLeftWall(curSlice, prevSlice);
				fillRightWall(curSlice, prevSlice);
				fillTrack(curSlice, prevSlice);
			}
		}
		
		// If the track is closed, join the last and first slices
		const lastSlice = (ribbon[0].length - 1) * verticesPerSlice;
		if (closed) {
			fillLeftWall(0, lastSlice);
			fillRightWall(0, lastSlice);
			fillTrack(0, lastSlice);
		}
		
		// Otherwise cap the ends
		else {
			// Cap front ends of the meshes
			pushWallEnd(leftWallIndices,
				oLeftWallInnerMiddle,
				oLeftWallInnerBottom, oLeftWallOuterBottom,
				oLeftWallOuterTop, oLeftWallInnerTop);
			pushWallEnd(rightWallIndices,
				oRightWallInnerMiddle,
				oRightWallInnerTop, oRightWallOuterTop,
				oRightWallOuterBottom, oRightWallInnerBottom);
			pushRectangle(trackIndices, oTrackRightBottom, oTrackLeftBottom, oTrackLeftTop, oTrackRightTop);
				
			// Cap the back ends of the meshes
			pushWallEnd(leftWallIndices,
				lastSlice + oLeftWallInnerMiddle,
				lastSlice + oLeftWallInnerTop, lastSlice + oLeftWallOuterTop,
				lastSlice + oLeftWallOuterBottom, lastSlice + oLeftWallInnerBottom);
			pushWallEnd(rightWallIndices,
				lastSlice + oRightWallInnerMiddle,
				lastSlice + oRightWallInnerBottom, lastSlice + oRightWallOuterBottom,
				lastSlice + oRightWallOuterTop, lastSlice + oRightWallInnerTop);
			pushRectangle(trackIndices,
				lastSlice + oTrackLeftBottom,
				lastSlice + oTrackRightBottom,
				lastSlice + oTrackRightTop,
				lastSlice + oTrackLeftTop);
		}
			
		// Apply the vertices and faces to the meshes
		const setMesh = function(mesh, indices) {
			//const normals = [];
			//VertexData.ComputeNormals(positions, indices, normals);
			const vertexData = new VertexData();
			vertexData.positions = positions;
			vertexData.indices = indices;
			//vertexData.normals = normals;
			vertexData.applyToMesh(mesh);
		}
		setMesh(leftWallMesh, leftWallIndices);
		setMesh(rightWallMesh, rightWallIndices);
		setMesh(trackMesh, trackIndices);
		
		// Add materials
		leftWallMesh.material = this.#wallMaterial;
		rightWallMesh.material = this.#wallMaterial;
		trackMesh.material = this.#trackMaterial;
		
		// Apply the physics
		leftWallMesh.physicsImpostor = new PhysicsImpostor(leftWallMesh, PhysicsImpostor.MeshImpostor, meshOptions, scene);
		rightWallMesh.physicsImpostor = new PhysicsImpostor(rightWallMesh, PhysicsImpostor.MeshImpostor, meshOptions, scene);
		trackMesh.physicsImpostor = new PhysicsImpostor(trackMesh, PhysicsImpostor.MeshImpostor, meshOptions, scene);
		
		return [ leftWallMesh, rightWallMesh, trackMesh ];
	}

	createVector(u) {return new Vector3(u.x, u.y, u.z) }

	createViews() { this.createScene() }

	destroyMesh(mesh, view) {
		if (view) {
			if (!view.scene) throw new Error(errorMustInvokeCreateViews);
		} else {
			if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
			if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		}

		if (mesh) {
			const scene = view ? view.scene : this.#sceneManager.scene;
			scene.removeMesh(mesh);
			mesh.dispose();
		}
		return false;
	}

	// TODO: disableView seems to permenantly disable the view. This may be
	// because there is only one view per scene in the current tests.

	disableView(view) {
		//view.view.enabled = false;
		//view.scene.detachControl();
		//if (this.#engine.inputElement === view.canvas) this.#engine.inputElement = null;
		//console.log("disableView", this.#engine.inputElement);
	}

	enableView(view) {
		view.view.enabled = true;
		view.scene.attachControl();
		this.#engine.inputElement = view.canvas;
	}

	static async initializePhysics() {
		await ammo.bind(window)();
	}

	ready() {
		if (!this.#sceneManager) throw new Error(errorMustInvokeSetAdd);
		if (!this.#sceneManager.scene) throw new Error(errorMustInvokeCreate);
		this.#ready = true;
	}

	render(view) {
		const scene = view ? view.scene : this.#sceneManager.scene;
		if (this.#ready && scene.activeCamera) scene.render();
	}

	resize() { if (this.#engine) this.#engine.resize(); }

	setCanvas(idOrCanvas) {
		if (!this.#sceneManager) {
			this.#sceneManager = new SingleSceneManager(idOrCanvas);
		} else if (this.#sceneManager instanceof SingleSceneManager) {
			throw new Error(errorCannotMultipleInvokeSetCanvas);
		} else {
			throw new Error(errorCannotMix);
		}
	}

	startRenderLoop() {
		if (!this.#engine) throw new Error(errorMustInvokeCreateEngine);
		this.#engine.runRenderLoop(() => this.#renderLoop());
	}

	static #createCamera(canvas, scene, name) {
		const camera = new ArcRotateCamera(
			'camera-' + name,
			3 * Math.PI / 2,
			3 * Math.PI / 8,
			30,
			Vector3.Zero(),
			scene);
		camera.attachControl(canvas, true);
		return camera;
	}

	static #createLight(scene, name) {
		return new HemisphericLight('light-' + name, new Vector3(0, 50, 0), scene);
	}

	#createScene(canvas) {
		const name = BabylonAdaptor.#createUniqueName(canvas.id);
		const scene = new Scene(this.#engine);
		BabylonAdaptor.#createCamera(canvas, scene, name);
		BabylonAdaptor.#createLight(scene, name);
		BabylonAdaptor.#enablePhysics(scene);
		return scene;
	}

	static #createUniqueName(preferred) {
		return preferred ? preferred : crypto.randomUUID();
	}

	static #enablePhysics(scene) {
		scene.enablePhysics(new Vector3(0, -8.91, 0), new AmmoJSPlugin());
	}

	#renderLoop() {
		if (!this.#ready) return;
		this.#sceneManager.render(this.#engine);
	}
}

export default BabylonAdaptor