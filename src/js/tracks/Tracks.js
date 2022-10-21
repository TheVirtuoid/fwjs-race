import TrackRegistrationError from "./errors/TrackRegistrationError";
import TrackSelectorInvokeError from "./errors/TrackSelectorInvokeError";

let instance;

export default class Tracks {

	#start;
	#originalMember;
	#families;
	#familySelector;
	#memberSelector;
	#tracks;
	#options;
	#meshes;

	constructor() {
		if (!instance) {
			instance = this;
		}
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
		const familyKey = this._removeSpaces(family);

		// Get the member
		if (track.sibling && !track.member) {
			throw new TrackRegistrationError('A track defining "sibling" must also define "member".');
		}
		if (track.sibling && track.member && track.member === this._originalMember) {
			throw new TrackRegistrationError(`A track defining "sibling" cannot have "member" set to "${this._originalMember}".`);
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
		this._onFamilyChanged();
	}

	#createMesh() {
		// TODO: ball shouldn't be here - we will need to fix this
		// ball.destroy();
		for (let mesh of this._meshes) babylon.destroyMesh(mesh);
		this._meshes.length = 0;

		try {
			const key = this._memberSelector.value;
			const track = this._tracks[key];
			const settings = this._options[key] ? this._options[key] : {};

			const ribbons = TrackPOC.build(track, (u) => { return new BABYLON.Vector3(u.x, u.y, u.z); }, settings);
			const ribbon = ribbons[0];
			const leftRoad = ribbon[1];
			const rightRoad = ribbon[2];
			const p0left = leftRoad[0];
			const p0right = rightRoad[0];
			const p1left = leftRoad[1];
			const p1right = rightRoad[1];
			this._start = {
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
			for (let i = 0; i < ribbons.length; i++) {
				tracks._meshes.push(babylon.createRibbon(`Segment${i}`, ribbons[i], track.closed, { mass: 0 }));
			}
			displayMgr.clearError();
		} catch (e) {
			displayMgr.showError(e);
		}
	},
	_onFamilyChanged: function() {
		const key = this._familySelector.value;
		let firstMatch = -1;
		for (let i = 0; i < this._memberSelector.options.length; i++) {
			const option = this._memberSelector.options[i];
			const match = option.getAttribute("family") === key;
			option.style.display = match ? "block" : "none";
			if (match && firstMatch === -1) firstMatch = i;
		}
		if (firstMatch !== -1) this._memberSelector.selectedIndex = firstMatch;
		this._createMesh();
	},

	_families: {},
	_meshes: [],
	_options: {},
	_originalMember: 'Original',
	_removeSpaces: function(value) { return value.replace(/\s/g, ''); },
	_tracks: {},
}
