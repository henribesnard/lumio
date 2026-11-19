// Dev-only helper: lets MSW's setupWorker() find its worker script when the
// frontend runs under `vite dev` (the file is not registered in production,
// where mock mode is disabled and this file is never requested).
importScripts("/node_modules/msw/lib/mockServiceWorker.js");
