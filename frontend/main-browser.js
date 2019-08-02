// This is the entry file for the browserify
// browser bundle.
const router = require('./lib/router/browser.jsx')
const routes = require('./routes')

const root = document.getElementById('root')
router(routes)(root)
