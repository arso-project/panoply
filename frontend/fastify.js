// const router = require('./lib/router/ssr')
const p = require('path')
const html = require('./html')

module.exports = async function (fastify, opts) {
  fastify.register(require('fastify-static'), {
    prefix: '/dist',
    root: p.join(__dirname, 'dist', 'browser'),
    decorateReply: false
  })

  fastify.get('/*', async (request, reply) => {
    const htmlString = html({
      prefix: opts.prefix
    })
    reply.type('text/html')
    reply.send(htmlString)
  })

  // let routes
  // if (opts.ssr) {
  //   routes = require('./dist/ssr/main.js')
  // } else {
  //   routes = [{
  //     path: '/*',
  //     exact: false,
  //     ssr: false
  //   }]
  // }

  // return router(routes)(fastify, opts)
}
