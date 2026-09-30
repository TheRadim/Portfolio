// Public endpoint for the deployed Stories service.
// No passwords or private keys belong in this file.
window.STORIES_CONFIG = {
  apiBase: ["localhost", "127.0.0.1"].includes(location.hostname) ? "/api" : "https://storiesapi-dc5a4kthhq-ew.a.run.app"
};
