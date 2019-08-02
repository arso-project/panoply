const React = require('react')
// const { useMemo, useState, useCallback } = require('react')
const Wrapper = require('../components/wrapper.jsx')
const styles = require('./id.css')

module.exports = IdPage

function IdPage (props) {
  const { match: { params } } = props
  return (
    <Wrapper>
      <h1 className={styles.title}>
        Id page
      </h1>
      <p>
        id: { params.id }
      </p>
    </Wrapper>
  )
}
