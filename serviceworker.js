importScripts("./js/worker/state.js");
importScripts("./js/worker/counter-state.js");

self.onmessage = function(message) {
	console.log("Message sent from tab", message.source.id, "with payload", message)
	if (message.data.GET_STATE) {
		syncTabState(store.getState());
	} else if (message.data.TAB_KILLED) {
		checkIfAllTabsKilled(actions.RESET)
	} else if (message.data.ACTION) {
		dispatchToStore(message.data.ACTION)
	}
}

// Dispatch a store event and sync that back to the tabs
function dispatchToStore(action, clientId) {
	console.log("Dispatching Redux event - ", action);
	store.dispatch(action).then(() => {
		syncTabState(store.getState());
	})
}

// Check if all the tabs have died and if so reset the state
function checkIfAllTabsKilled(RESET) {
	console.log("Tab was killed");
	clients.matchAll().then((clients) => {
		if (clients.length === 0) {
			store.dispatch(RESET);
		}
	});
}

// Sync the state back to all the available tabs and windows
function syncTabState(newState) {
	clients.matchAll().then((clients) => {
		// Loop over all available clients
		clients.forEach((client) => {
			const data = { state: newState }
			console.log("Sending out new state", data);
			client.postMessage(data);
		});

	});
}
