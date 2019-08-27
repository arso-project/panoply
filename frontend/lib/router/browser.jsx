const React = require('react')
const { hydrate } = require('react-dom')
const { Route } = require('react-router')
const { BrowserRouter } = require('react-router-dom')
const { renderRoutes } = require('react-router-config')
const production = process.env.NODE_ENV === 'production'

// client side logging is silent in production
const logger = require('pino')({
  level: production ? 'silent' : 'info'
})

function LoggingRouter (props) {
  const { prefix = '', history, children } = props
  return (
    <BrowserRouter history={history} logger={logger}>
      {children}
    </BrowserRouter>
  )
}

function router (routes = [], opts = {}) {
  return async (mount) => {
    if (routes.length === 0) return
    if (opts.prefix) {
      routes = routes.map(route => {
        route.path = opts.prefix + route.path
        return route
      })
    }
    hydrate(
      <LoggingRouter prefix={opts.prefix}>
        {renderRoutes(routes)}
      </LoggingRouter>
      , mount)
  }
}

module.exports = router
