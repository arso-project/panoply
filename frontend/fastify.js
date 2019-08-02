const router = require('./lib/router/ssr')
const p = require('path')

module.exports = async function (fastify, opts) {
  fastify.register(require('fastify-static'), {
    root: p.join(__dirname, 'dist', 'browser'),
    decorateReply: false
  })

  const routes = require('./dist/ssr/main.js')
  return router(routes)(fastify, opts)
}
