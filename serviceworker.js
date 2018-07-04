importScripts("./js/worker/state.js");
importScripts("./js/worker/counter-state.js");

// Service Worker Logic
self.addEventListener('activate', function(event) {

	console.log("SERVICE WORKER EVENT - activiate");
	// `claim()` sets this worker as the active worker for all clients that
	// match the workers scope and triggers an `oncontrollerchange` event for
	// the clients.
	return self.clients.claim();
});

self.addEventListener('install', function(event) {
	console.log("SERVICE WORKER EVENT - install");
	self.skipWaiting();
});


let lastNumberOfClients = 0;

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


function getTabs() {
	return self.clients.claim().then(() =>{
		return clients.matchAll(
			{
				includeUncontrolled: true,
				type: "window"
			}
		);
	})
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

	getTabs().then((clients) => {

		// Sometimes the new client exists before we can check if there
		// are no tabs open at all. Essentially we need to handle the refresh case
		const isRefresh = clients.length === 1 && lastNumberOfClients < 2;
		const shouldReset = clients.length === 0 || isRefresh;

		if (shouldReset) {
			// Reset state back to normal
			store.dispatch(RESET);
		}

		this.lastNumberOfClients = clients.length;

	});

}

// Sync the state back to all the available tabs and windows
function syncTabState(newState) {
	getTabs().then((clients) => {
		// Loop over all available clients
		clients.forEach((client) => {
			const data = { state: newState }
			console.log("Sending out new state", data);
			client.postMessage(data);
		});

	});
}
