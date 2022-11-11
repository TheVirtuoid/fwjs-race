import createPoint from './point.js'
import createSpiral from './spiral.js'
import createStandard from './standard.js'
import initStraight from './straight.js'
import createTangentWeight from './tangentWeight.js'

await async function() {

	// Construt the demos
	const demos = [];
	demos.push(createStandard());
	demos.push(createTangentWeight());
	demos.push(createPoint());
	demos.push(createSpiral());
	//demos.push(initStraight());

	// Initialize the demos
	const promises = [];
	for (let demo of demos) promises.push(demo.initialize());
	for (let promise of promises) await promise;

	// Perform the initial draw the demos
	for (let demo of demos) demo.draw();
}();
/*
window.addEventListener('load', () => async function() {
	console.log('load');
	await onLoad();
});*/
