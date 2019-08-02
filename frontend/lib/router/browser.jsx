const React = require('react')
const { hydrate } = require('react-dom')
const { BrowserRouter } = require('react-router-dom')
const { renderRoutes } = require('react-router-config')
const production = process.env.NODE_ENV === 'production'

// client side logging is silent in production
const logger = require('pino')({
  level: production ? 'silent' : 'info'
})

function LoggingRouter ({ history, children }) {
  return (
    <BrowserRouter history={history} logger={logger}>
      {children}
    </BrowserRouter>
  )
}

function router (routes = []) {
  return async (mount) => {
    if (routes.length === 0) return
    hydrate(
      <LoggingRouter>
        {renderRoutes(routes)}
      </LoggingRouter>
      , mount)
  }
}

module.exports = router
