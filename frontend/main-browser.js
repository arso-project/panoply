// This is the entry file for the browserify
// browser bundle.
const router = require('./lib/router/browser.jsx')
const routes = require('./routes')

const opts = window.__archipel || {}

const root = document.getElementById('root')
router(routes, opts)(root)
