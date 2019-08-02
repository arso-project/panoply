const React = require('react')
// const { useMemo, useState, useCallback } = require('react')
const Wrapper = require('./wrapper.jsx')

module.exports = IdPage

function IdPage (props) {
  const { match: { params } } = props
  return (
    <Wrapper>
      <p>
        id: { params.id }
      </p>
    </Wrapper>
  )
}
