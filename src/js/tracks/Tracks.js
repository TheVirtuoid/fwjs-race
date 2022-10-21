import TrackRegistrationError from "./errors/TrackRegistrationError";
import TrackSelectorInvokeError from "./errors/TrackSelectorInvokeError";

let instance;

export default class Tracks {

	#start;
	#originalMember = 'Original';
	#families;
	#familySelector;
	#memberSelector;
	#tracks;
	#options;
	#meshes;
	#graphicsEngine;
	#displayManager;

	constructor(graphicsEngine, displayManager) {
		if (!instance) {
			instance = this;
		}
		this.#graphicsEngine = graphicsEngine;
		this.#displayManager = displayManager;
		return instance;
	}

	getTrackStart() {
		return this.#start;
	}

	register(track) {

		// Invoke function if not an object
		if (typeof(track) === 'function') {
			track = track();
		}

		// Perform late initialization
		if (track.init) {
			track.init();
		}

		// Get the family
		if (!track.family && !track.sibling) {
			throw new TrackRegistrationError('A track must define either "family" or "sibling"');
		}
		if ((track.family || track.sibling) && (track.name || track.desc)) {
			throw new TrackRegistrationError('A track defining "family" or "sibling" cannot define "name" or "desc".');
		}
		if (track.sibling && !track.sibling.family) {
			throw new TrackRegistrationError(`A "sibling" track, here "${track.sibling}", must define "family"`);
		}
		const family = track.family ? track.family : track.sibling.family;
		const familyKey = this.#removeSpaces(family);

		// Get the member
		if (track.sibling && !track.member) {
			throw new TrackRegistrationError('A track defining "sibling" must also define "member".');
		}
		if (track.sibling && track.member && track.member === this.#originalMember) {
			throw new TrackRegistrationError(`A track defining "sibling" cannot have "member" set to "${this.#originalMember}".`);
		}
		const member = track.member ? track.member : this.#originalMember;
		const memberKey = familyKey + this.#removeSpaces(member);
		const key = familyKey + memberKey;

		// Add family if necessary
		if (!this.#families[familyKey]) {
			// This possibly leads to multiple member lists to avoid
			// altering the 'display' style in onFamilyChanged
			this.#families[familyKey] = [];

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

		// Add the track to the tracks and options arrays
		this.#tracks[key] = track.track;
		if (track.options) {
			this.#options[key] = track.options;
		}

		return track;
	}

	setSelectors(familyId, membersId) {
		this.#familySelector = document.getElementById(familyId);
		this.#memberSelector = document.getElementById(membersId);
		this.#familySelector.addEventListener("change", this.#onFamilyChanged.bind(this));
		this.#memberSelector.addEventListener("change", this.#createMesh.bind(this));
	}

	start() {
		if (!this.#familySelector || !this.#memberSelector) {
			throw new TrackSelectorInvokeError();
		}
		this.#onFamilyChanged();
	}

	#createMesh() {
		// TODO: ball shouldn't be here - we will need to fix this
		// ball.destroy();
		this.#meshes.forEach((mesh) => this.#graphicsEngine.destroyMesh(mesh));
		this.#meshes = [];

		try {
			const key = this.#memberSelector.value;
			const track = this.#tracks[key];
			const settings = this.#options[key] ? this.#options[key] : {};

			const ribbons = TrackPOC.build(track, (u) => {
				return this.#graphicsEngine.createVector3(u.x, u.y, u.z);
				}, settings);
			const ribbon = ribbons[0];
			const leftRoad = ribbon[1];
			const rightRoad = ribbon[2];
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
			this.#meshes = ribbons.map((mesh, index) => {
				return this.#graphicsEngine.createRibbon(`Segment${index}`, ribbon, track.closed, { mass: 0 })
			});
			this.#displayManager.clearError();
		} catch (e) {
			this.#displayManager.showError(e);
		}
	}

	#onFamilyChanged() {
		const key = this.#familySelector.value;
		let firstMatch = -1;
		this.#memberSelector.options.forEach((option, index) => {
			const match = option.getAttribute("family") === key;
			option.style.display = match ? "block" : "none";
			if (match && firstMatch === -1) {
				firstMatch = index;
			}
		});
		if (firstMatch !== -1) {
			this.#memberSelector.selectedIndex = firstMatch;
		}
		this.#createMesh();
	}

	#removeSpaces(value) {
		return value.replace(/\s/g, '');
	}
}
