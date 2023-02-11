import { TrackPOC } from './Builder.js'

class TrackDisplay {

	static #originalMember = 'Original';

	#buildSelector;
	#errorDisplay;
	#families;
	#familySelector;
	#gameEngine;
	#memberSelector;
	#meshes;
	#registerCallback;
	#resetCallback;
	#start;
	#tracks;

	constructor(familyId, membersId, buildId, gameEngine, errorDisplay, resetCallback, registerCallback) {
		this.#gameEngine = gameEngine;
		this.#errorDisplay = errorDisplay;
		this.#resetCallback = resetCallback;
		this.#registerCallback = registerCallback;

		this.#familySelector = document.getElementById(familyId);
		this.#memberSelector = document.getElementById(membersId);
		this.#buildSelector = document.getElementById(buildId);
		this.#familySelector.addEventListener("change", () => this.#onFamilyChanged());
		this.#memberSelector.addEventListener("change", () => this.#onMemberChanged());
		this.#buildSelector.addEventListener("change", () => this.#onBuildChanged());
		
		for (let buildOption of gameEngine.buildOptions) {
			const option = document.createElement("option");
			option.setAttribute('value', buildOption.key);
			option.innerHTML = buildOption.text;
			this.#buildSelector.appendChild(option);
		}

		this.#families = {};
		this.#tracks = {};
		this.#meshes = [];
	}

	createMesh() {
		this.#resetCallback();
		for (let mesh of this.#meshes) this.#gameEngine.destroyMesh(mesh);
		this.#meshes.length = 0;

		try {
			const key = this.#memberSelector.value;
			const track = this.#tracks[key];
			const settings = track.options ? track.options : {};

			// Produce the track segments
			this.#registerCallback(track);
			const trackSegments = TrackPOC(track, this.#gameEngine.createVector, settings);

			// Save the start location
			const trackSegment = trackSegments[0];
			const leftRoad = trackSegment.track.ribbon[1];
			const rightRoad = trackSegment.track.ribbon[2];
			const p0left = leftRoad[0];
			const p0right = rightRoad[0];
			const p1left = leftRoad[1];
			const p1right = rightRoad[1];
			this.#start = {
				p0: {
					x: (p0left.x + p0right.x) / 2,
					y: (p0left.y + p0right.y) / 2,
					z: (p0left.z + p0right.z) / 2,
				},
				p1: {
					x: (p1left.x + p1right.x) / 2,
					y: (p1left.y + p1right.y) / 2,
					z: (p1left.z + p1right.z) / 2,
				},
			}

			// Produce the track
			const buildOption = this.#buildSelector.value;
			for (let i = 0; i < trackSegments.length; i++) {
				const trackSegment = trackSegments[i];
				this.#meshes.push(this.#gameEngine.createTrack(
					`Segment${i}`,
					trackSegment.track.ribbon,
					track.closed,
					buildOption,
					{ mass: 0 }));
				for (let j = 0; j < trackSegment.medians.length; j++) {
					this.#meshes.push(this.#gameEngine.createMedian(
						`Segment${i}.median${j}`,
						trackSegment.medians[j].ribbon,
						track.closed,
						buildOption,
						{ mass: 0 }));
				}
			}
			this.#errorDisplay.clear();
		} catch (e) {
			this.#errorDisplay.showError(e);
		}
	}

	getTrackStart() { return this.#start }

	register(track) {

		// Invoke function if not an object
		if (typeof(track) === 'function') track = track();

		// Perform late initialization
		if (track.init) track.init();

		// Get the family
		if (!track.family && !track.sibling) {
			throw new Error("A track must define either 'family' or 'sibling'")
		}
		if ((track.family || track.sibling) && (track.name || track.desc)) {
			throw new Error("A track defining 'family' or 'sibling' cannot define 'name' or 'desc'")
		}
		if (track.sibling && !track.sibling.family) {
			throw new Error(`A 'sibling' track, here '${track.sibling}', must define 'family'`)
		}
		const family = track.family ? track.family : track.sibling.family;
		const familyKey = TrackDisplay.#removeSpaces(family);

		// Get the member
		if (track.sibling && !track.member) throw "A track defining 'sibling' must also define 'member'";
		if (track.sibling && track.member && track.member === TrackDisplay.#originalMember) {
			throw new Error(`A track defining 'sibling' cannot have 'member' set to '${TrackDisplay.#originalMember}'`)
		}
		const member = track.member ? track.member : TrackDisplay.#originalMember;
		const memberKey = familyKey + TrackDisplay.#removeSpaces(member);
		const key = familyKey + memberKey;

		// Add family if necessary
		if (!this.#families[familyKey]) {
			this.#families[familyKey] = true;

			// Add the family to the family list
			const fsOption = document.createElement("option");
			fsOption.setAttribute('value', familyKey);
			fsOption.innerHTML = family;
			this.#familySelector.appendChild(fsOption);
		}

		// Add to member selector
		const msOption = document.createElement("option");
		msOption.setAttribute('value', key);
		msOption.setAttribute('family', familyKey);
		msOption.innerHTML = member;
		this.#memberSelector.appendChild(msOption);

		// Add the track to the tracks array
		this.#tracks[key] = track.track;
		return track;
	}

	start() {
		if (!this.#familySelector || !this.#memberSelector || !this.#buildSelector) {
			throw new Error("Must invoke setSelectors first")
		}
		this.#onFamilyChanged()
	}
	
	#onBuildChanged() {
		this.createMesh();
	}

	#onFamilyChanged() {
		const key = this.#familySelector.value;
		let firstMatch = -1;
		for (let i = 0; i < this.#memberSelector.options.length; i++) {
			const option = this.#memberSelector.options[i];
			const match = option.getAttribute("family") === key;
			option.style.display = match ? "block" : "none";
			if (match && firstMatch === -1) firstMatch = i;
		}
		if (firstMatch !== -1) this.#memberSelector.selectedIndex = firstMatch;
		this.createMesh();
	}

	#onMemberChanged() { this.createMesh() }

	static #removeSpaces(value) { return value.replace(/\s/g, '') }
}

export default TrackDisplay
