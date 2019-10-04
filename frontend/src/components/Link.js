const React = require('react')
const { NavLink } = require('react-router-dom')

const opts = window.__archipel

// TODO: Move link style?
const styles = require('./wrapper.css')

module.exports = { Link }

function Link (props) {
  let { to, children } = props
  if (opts.prefix) to = opts.prefix + to
  return (
    <NavLink
      to={to}
      exact
      strict={false}
      activeClassName={styles.active}>
      {children}
    </NavLink>
  )
}
