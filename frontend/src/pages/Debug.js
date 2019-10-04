const React = require('react')
const Wrapper = require('../components/Wrapper.js')

const { MaterialTest } = require('./material-test.jsx')

module.exports = DebugPage

function DebugPage (props) {
  // const { match: { params } } = props
  return (
    <Wrapper>
      <h1>
        Debug
      </h1>
      <MaterialTest />
    </Wrapper>
  )
}
