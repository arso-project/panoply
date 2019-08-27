const router = require('./lib/router/ssr')
const p = require('path')

module.exports = async function (fastify, opts) {
  fastify.register(require('fastify-static'), {
    prefix: '/dist',
    root: p.join(__dirname, 'dist', 'browser'),
    decorateReply: false
  })

  let routes
  if (opts.ssr) {
    routes = require('./dist/ssr/main.js')
  } else {
    routes = [{
      path: '/*',
      exact: false,
      ssr: false
    }]
  }

  return router(routes)(fastify, opts)
}
