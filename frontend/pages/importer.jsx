const React = require('react')
// const { useMemo, useState, useCallback } = require('react')
const Wrapper = require('../components/wrapper.jsx')

module.exports = ImporterPage

function ImporterPage (props) {
  return (
    <Wrapper>
      Importer!
      <Importer />
    </Wrapper>
  )
}

function Importer (props) {
  return (
    <form onSubmit={onFormSubmit}>
      <input type='text' name='url' placeholder='Enter URL ...' />
      <button type='submit'>Start</button>
    </form>
  )

  function onFormSubmit (e) {
  }
}
