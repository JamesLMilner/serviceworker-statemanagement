class ServiceWorkerStateManager {

	constructor(store) {
		this.store = store;
		this.lastKnownNumClients = 0;
		this.initialiseOnMessage();
	}

	initialiseOnMessage() {
		if (!self) {
			console.error("Self undefined, are you sure this is a worker context?");
			return;
		}
		self.onmessage = (message) => {
			if (message.data.GET_STATE) {
				this.store.getState().then((state) => {
					this.syncTabState(state);
				});
			} else if (message.data.TAB_KILLED) {
				this.checkIfAllTabsKilled(actions.RESET)
			} else if (message.data.ACTION) {
				this.dispatchToStore(message.data.ACTION)
			}
		}
	}


	getTabs() {
		return self.clients.claim().then(() => {
			return clients.matchAll(
				{
					includeUncontrolled: true,
					type: "window"
				}
			);
		})
	}


	// Dispatch a store event and sync that back to the tabs
	dispatchToStore(action, clientId) {
		this.store.dispatch(action).then(() => {
			this.store.getState().then((state) => {
				this.syncTabState(state);
			})
		})
	}

	// Check if all the tabs have died and if so reset the state
	checkIfAllTabsKilled(RESET) {

		this.getTabs().then((clients) => {

			// Sometimes the new client exists before we can check if there
			// are no tabs open at all. Essentially we need to handle the refresh case
			const isRefresh = clients.length === 1 && this.lastKnownNumClients < 2;
			const shouldReset = clients.length === 0 || isRefresh;

			if (shouldReset) {
				// Reset state back to normal
				this.store.dispatch(RESET);
			}

			this.lastKnownNumClients = clients.length;

		});

	}

	// Sync the state back to all the available tabs and windows
	syncTabState(newState) {

		this.getTabs().then((clients) => {
			// Loop over all available clients
			clients.forEach((client) => {
				const data = { state: newState }
				client.postMessage(data);
			});

			this.lastKnownNumClients = clients.length;

		});

	}

}
