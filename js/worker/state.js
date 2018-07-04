

importScripts("./js/worker/idb.js");

class StateManager {

    constructor(storeName, initialState, reducer) {
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
            if (state !== undefined) {
                console.log("Rehydrating to state", state);
                this.store = state;
            }
        });
    }

	getState() {
        return this.store;
    }

	dispatch(action) {
        console.log("action", action);
		return this.dispatchAction(action).then((newState) => {
            return this.db.set("state", newState)
                .then(() => {
                    this.store = Object.assign({}, newState);
                })
                .catch((error) => {
                    console.error("Something went wrong setting IndexedDB", error);
                })
        })

    }

	dispatchAction(action) {
        return this.ready.then(() => {
            const newState = this.reducer(this.getState(), action);
            console.log(newState);
            return newState;
        });
    }

}
