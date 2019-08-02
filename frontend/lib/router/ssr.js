const ReactDOMServer = require('react-dom/server')
const React = require('react')
const { StaticRouter } = require('react-router')
const html = require('../../html')

function router (routes) {
  return async (fastify, opts) => {
    for (const { path, exact, component } of routes) {
      if (exact !== true) {
        throw Error('All server routes should have exact:true to avoid partial matching.')
      }

      // preinit and hydrate server side state for all routes
      const props = {
        match: { params: {}, path, url: '', isExact: exact },
        logger: fastify.log,
        ssr: true
      }
      render(component, props)

      fastify.get(path, async (request, reply) => {
        const params = request.params
        const props = {
          match: { params, path, url: request.raw.url, isExact: exact },
          logger: request.log,
          ssr: true
        }

        const renderedPage = render(component, props)

        const htmlString = html({
          main: renderedPage,
          prefix: opts.prefix
        })

        reply.type('text/html')
        reply.send(htmlString)
      })
    }
  }
}

function render (component, props) {
  return ReactDOMServer.renderToString(
    React.createElement(StaticRouter, {},
      React.createElement(component, props)
    )
  )
}

module.exports = router
