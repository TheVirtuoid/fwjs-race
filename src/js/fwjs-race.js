import styles from "../css/fwjs-race.pcss";
import {Engine, FreeCamera, HemisphericLight, MeshBuilder, PhysicsImpostor, Scene, Vector3} from "@babylonjs/core";
import Cannon from "cannon";
import Light from "./Light/Light";
import Camera from "./Camera/Camera";
import Car from "./Car/Car";
import Track from "./Track/Track";
import Stage from "./Stage/Stage";

window.CANNON = Cannon;

const world = document.getElementById('world');
const engine = new Engine(world);

const stage = new Stage({ engine });
const scene = stage.scene;

const camera = new Camera({ scene, world });

const light = new Light({ scene });

const car = new Car({ scene });

const track = new Track({ scene });

engine.runRenderLoop(() => {
	scene.render();
});