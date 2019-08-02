const React = require('react')
const { useRef } = require('react')
const { NavLink } = require('react-router-dom')
const { Cards } = require('./cards.jsx')

module.exports = Wrapper

require('./global.css')

const styles = require('./wrapper.css')

function Wrapper (props) {
  const { children } = props
  const root = useRef()
  return (
    <div ref={root} className={styles.root}>
      <nav className={styles.nav}>
        {link('/', 'Home')}
        {link('/id/foo', 'Foo')}
      </nav>
      <input type='range' onChange={onRangeChange} min={0} max={360} />
      <main>
        {children}
      </main>
    </div>
  )

  function link (to, text) {
    return (
      <NavLink
        to={to}
        exact
        activeClassName={styles.active}>
        {text}
      </NavLink>
    )
  }

  function onRangeChange (e) {
    if (!root.current) return
    const value = e.target.value
    root.current.style.setProperty('--hue', value)
  }
}

function CardExample () {
  let children = []
  for (let i = 0; i < 49; i++) {
    children.push(
      <div key={i}>Card #{i}</div>
    )
  }
  return (
    <Cards>{children}</Cards>
  )
}
