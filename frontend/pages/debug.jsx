const React = require('react')
const Wrapper = require('../components/wrapper.jsx')

const { useSSRTest } = require('../lib/utils')

module.exports = DebugPage

function DebugPage (props) {
  const { match: { params } } = props
  const result = useSSRTest()
  return (
    <div>
      <h1>
        Debug
      </h1>
      {result}
    </div>
  )
}
