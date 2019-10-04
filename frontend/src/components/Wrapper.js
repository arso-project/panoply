const React = require('react')
const { useRef } = require('react')
const { Cards } = require('./Cards.js')
const { Nav } = require('./Nav.js')

module.exports = Wrapper

require('./global.css')

const styles = require('./wrapper.css')

function Wrapper (props) {
  const { children } = props
  const { ref, colorChanger } = useColorChanger()
  return (
    <div ref={ref} className={styles.root}>
      <Nav />
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
