// Must be required before any other module (see package.json start script)
// so dd-trace can patch express/pg before they're loaded.
// Service name, env, and version come from DD_SERVICE / DD_ENV / DD_VERSION
// env vars set on the Deployment (unified service tagging) rather than being
// hardcoded here, so this file is identical across every app in the lab.
const tracer = require('dd-trace').init({
  logInjection: true,
  runtimeMetrics: true,
});

module.exports = tracer;
