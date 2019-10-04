import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import pino from 'pino'

const production = process.env.NODE_ENV === 'production'

// client side logging is silent in production
const logger = pino({
  level: production ? 'silent' : 'info'
})

export default function Router (props) {
  const { routes, prefix = '' } = props

  if (prefix) {
    for (let route of routes) {
      route.path = opts.prefix + route.path
    }
  }

  const renderedRoutes = renderRoutes(routes)

  return (
      <BrowserRouter history={history} logger={logger} prefix={prefix}>
        {renderedRoutes}
      </BrowserRouter>
  )
}
