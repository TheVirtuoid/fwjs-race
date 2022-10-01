import {isNumber, isObject} from "../helpers/typeCheck";

export default class Vector {

	static angleToRadians = Math.PI / 180;

	static add(u, k, v) {
		return {
			x: u.x + k * v.x,
			y: u.y + k * v.y,
			z: u.z + k * v.z,
		}
	}

	static cross(u, v) {
		return {
			x: u.y * v.z - u.z * v.y,
			y: u.z * v.x - u.x * v.z,
			z: u.x * v.y - u.y * v.x,
		}
	}

	static difference(from, to) {
		return {
			x: to.x - from.x,
			y: to.y - from.y,
			z: to.z - from.z,
		};
	}

	static distance(u, v) {
		return Vector.length(Vector.difference(u, v));
	}

	static dot(u, v) {
		return u.x * v.x + u.y * v.y + u.z * v.z;
	}

	static down = { x:0, y:-1, z:0 };

	static interpolate(u, v, t) {
		const olt = 1 - t;
		return {
			x: olt * u.x + t * v.x,
			y: olt * u.y + t * v.y,
			z: olt * u.z + t * v.z,
		}
	}

	static length(u) {
		return Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
	}

	static midpoint(u, v) {
		return {
			x: (u.x + v.x) / 2,
			y: (u.y + v.y) / 2,
			z: (u.z + v.z) / 2,
		}
	}

	static multiply(k, u) {
		return {
			x: k * u.x,
			y: k * u.y,
			z: k * u.z,
		}
	}

	static normalize(u) {
		const length = Vector.length(u);
		return {
			x: u.x / length,
			y: u.y / length,
			z: u.z / length,
		};
	}

	static right = { x:1, y:0, z:0 };

	static rotate(axis, u, angle) {
		const theta = angle * Vector.angleToRadians;
		const cosTheta = Math.cos(theta);
		const sinTheta = Math.sin(theta);
		let result = Vector.multiply(cosTheta, u);
		result = Vector.add(result, sinTheta, Vector.cross(axis, u));
		return Vector.add(result, Vector.dot(axis, u) * (1 - cosTheta), axis);
	}

	static sum(coefficients, us) {
		let sum = Vector.zero;
		for (let i = 0; i < coefficients.length; i++) {
			sum = Vector.add(sum, coefficients[i], us[i]);
		}
		return sum;
	}

	static zero = { x:0, y:0, z:0 };

	static isVector(value, coords) {
		if (!isObject(value)) {
			return false;
		}
		for (let coordinate of coords) {
			if (!isNumber(value[coordinate])) {
				return false;
			}
		}
		return true;
	}

	static isVector3(value) {
		return Vector.isVector(value, Vector.coordinates3);
	}

	static coordinates3 = ['x', 'y', 'z'];
};
