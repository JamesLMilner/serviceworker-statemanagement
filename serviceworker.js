importScripts("./redux.4.0.0.min.js");

const RESET = 'RESET';
const INCREMENT = 'INCREMENT';
const DECREMENT = 'DECREMENT';

function counter(state, action) {
	if (typeof state === 'undefined') {
	  return 0
	}

	switch (action.type) {
		case RESET:
			return state * 0;
		case INCREMENT:
			return state + 1
		case DECREMENT:
			return state - 1
		default:
			return state
	}
}

const store = Redux.createStore(counter)

self.onmessage = function(message) {

	if (message.data.GET_STATE) {
		syncTabState();
	} else if (message.data.TAB_KILLED) {
		checkIfAllTabsKilled()
	} else if (message.data.ACTION) {
		dispatchToStore(message.data.ACTION )
	}

}

// Dispatch a store event and sync that back to the tabs
function dispatchToStore(action) {
	console.log("Dispatching Redux event - ", action)
	store.dispatch({ type: action });
	const id = message.source.id
	syncTabState(id);
}

// Check if all the tabs have died and if so reset the state
function checkIfAllTabsKilled() {
	console.log("Tab was killed");
	clients.matchAll().then(function(clients) {
		if (clients.length === 0) {
			store.dispatch({ type: RESET });
		}
	});
}

// Sync the state back to all the available tabs and windows
function syncTabState() {
	clients.matchAll().then(function(clients) {
		// Loop over all available clients
		clients.forEach(function(client) {
			const data = { state: store.getState().toString() }
			console.log("Sending out new state", data);
			client.postMessage(data);

		});

	})
}
