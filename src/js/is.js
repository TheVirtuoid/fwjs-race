const is = {
	array: function(value) {
		return this.object(value) && this.instance(value, 'Array');
	},
	boolean: function(value) {
		return typeof(value) === 'boolean';
	},
	default: function(value) {
		return value === null || value === undefined;
	},
	defined: function(value) {
		return value !== null && value !== undefined;
	},
	function: function(value) {
		return typeof(value) === 'function';
	},
	instance: function(value, className) {
		return value.constructor.toString().indexOf(className) > -1;
	},
	integer: function(value) {
		return Number.isInteger(value);
	},
	number: function(value) {
		return typeof(value) === 'number';
	},
	object: function(value) {
		return typeof(value) === 'object';
	},
	positiveNumber: function(value) {
		return this.number(value) && value > 0;
	},
	string: function(value) {
		return typeof(value) === 'string';
	},
	vector: function(value, coords) {
		if (!this.object(value)) return false;
		for (let coord of coords) {
			if (!this.number(value[coord])) return false;
		}
		return true;
	},
	vector3: function(value) {
		return this.vector(value, this._coords3);
	},
	_coords3: ['x', 'y', 'z'],
}

export default is;
