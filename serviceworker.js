importScripts("./js/worker/idb-state-manager.js");
importScripts("./js/worker/sw-state-manager.js");
importScripts("./js/worker/counter.js");

// Service Worker Logic
self.addEventListener('activate', function(event) {
	// `claim()` sets this worker as the active worker for all clients that
	// match the workers scope and triggers an `oncontrollerchange` event for
	// the clients.
	return self.clients.claim();
});

self.addEventListener('install', function(event) {
	self.skipWaiting();
});

const SWStateManager = new ServiceWorkerStateManager(store);


