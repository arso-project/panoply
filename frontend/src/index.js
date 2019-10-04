import React from 'react'
import ReactDOM from 'react-dom'
import Router from './Router'
import routes from './routes'

const opts = window.__archipel || {}

const root = document.getElementById('root')
ReactDOM.render(<Router routes={routes} opts={opts} />, root)
