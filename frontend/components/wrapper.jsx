const React = require('react')
const { Link } = require('react-router-dom')

module.exports = Wrapper

const styles = require('./wrapper.css')

function Wrapper (props) {
  const { children } = props
  return (
    <div className={styles.root}>
      <nav>
        <Link to='/'>Home</Link>
        <Link to='/id/foo'>Id: foo</Link>
      </nav>
      <main>
        {children}
      </main>
    </div>
  )
}
