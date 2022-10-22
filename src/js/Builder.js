import bezier from './bezier.js'

export function createBuilder(settings) {
	return {
		precision: settings.precision
	}
}

export function executeBuilder(builder, ribbon, sp0, sp1, vectorFactory) {
	return bezier.build(ribbon, sp0, sp1, vectorFactory, builder.precision);
}
