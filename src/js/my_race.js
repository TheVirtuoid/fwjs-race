import Venue from "./game/Venue";

/**
 * You can also Venue.load() to get everything at once,
 * 		or Venue.loadxxx() to load individual pieces.
 */
const venue = Venue.create();
venue.add('scene', Venue.createScene());
venue.add('camera', Venue.createCamera());
venue.add('light', Venue.createLight());
venue.add('layout', Venue.createLayout());
venue.add('model', Venue.loadModel('starting-gate'));
venue.add('model', Venue.loadModel('ending-gate'));

venue.add('car', Venue.loadModel('Mamas-Rambler'));
venue.add('car', Venue.loadModel('Plymouth-Fury-III'));
venue.add('car', Venue.loadModel('Dads-Caddy'));
venue.add('car', Venue.loadModel('Yugo'));

venue.initializeRace()
		.then(go)
		.then(result)
		.catch(reportIssue)
		.finally(finish);
