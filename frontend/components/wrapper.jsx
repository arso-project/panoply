const React = require('react')
const { useRef } = require('react')
const { Link } = require('./link.jsx')
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
        <Link to='/'>Browse</Link>
        <Link to='/search'>Search</Link>
        <Link to='/importer'>Importer</Link>
        <Link to='/add'>Add</Link>
      </nav>
      <main>
        {children}
      </main>
    </div>
  )
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
