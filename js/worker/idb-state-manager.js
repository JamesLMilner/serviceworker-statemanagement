

importScripts("./js/worker/idb.js");

class IDBStateManager {

	constructor(storeName, initialState, reducer, logging) {
		this.db = this.persist(storeName);
		this.ready = Promise.all([this.db.ready, this.rehydrate()]);
		this.store = initialState;
		this.reducer = reducer;
	}

	persist(storeName) {
		const dbPromise = idb.open(storeName + '-store', 1, upgradeDB => {
			upgradeDB.createObjectStore(storeName);
		});
		return {
			ready: dbPromise,
			get : function(key) {
				return dbPromise.then(db => {
				  return db.transaction(storeName)
					.objectStore(storeName).get(key);
				});
			},
			set : function(key, val) {
				return dbPromise.then(db => {
					const tx = db.transaction(storeName, 'readwrite');
					tx.objectStore(storeName).put(val, key);
					return tx.complete;
				});
			},
			clear : function() {
				return dbPromise.then(db => {
					const tx = db.transaction(storeName, 'readwrite');
					tx.objectStore(storeName).clear();
					return tx.complete;
				});
			}
		}
	}

	rehydrate() {
		return this.db.get("state").then((state) => {
			if (state) {
				console.log("Rehydrating to state", state);
				this.store = state;
			}
		});
	}

	getState() {
		return this.ready.then(() => {
			return this.store;
		});
	}

	dispatch(action) {
		return this.dispatchAction(action).then((newState) => {
			return this.db.set("state", newState)
				.then(() => {
					this.store = Object.assign({}, newState);
				})
				.catch((error) => {
					console.error("Something went wrong setting IndexedDB state", error);
				})
		})

	}

	dispatchAction(action) {
		return this.ready.then(() => {
			// Get the the current state from store
			return this.getState().then((currentState) => {
				// Return the new state from reducer
				return this.reducer(currentState, action);;
			})
		});
	}

}
