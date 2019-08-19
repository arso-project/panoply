const React = require('react')
const { useRef } = require('react')
const { NavLink } = require('react-router-dom')
const { Cards } = require('./cards.jsx')

module.exports = Wrapper

require('./global.css')

const styles = require('./wrapper.css')

function Wrapper (props) {
  const { children } = props
  const { ref, colorChanger } = useColorChanger()
  return (
    <div ref={ref} className={styles.root}>
      <nav className={styles.nav}>
        {link('/', 'Browse')}
        {link('/search', 'Search')}
        {link('/importer', 'Importer')}
      </nav>
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

}

function useColorChanger () {
  const ref = useRef()
  const colorChanger = (
      <input type='range' onChange={onRangeChange} min={0} max={360} />
  )
  function onRangeChange (e) {
    if (!ref.current) return
    const value = e.target.value
    ref.current.style.setProperty('--hue', value)
  }
  return { ref, colorChanger }
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
