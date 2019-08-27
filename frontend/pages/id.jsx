const React = require('react')
const { useMemo, useState, useCallback } = require('react')
const Wrapper = require('../components/wrapper.jsx')
const styles = require('./id.css')
const { useQuery } = require('../lib/records.js')
const L = require('lodash')

const { List, RecordSetCard } = require('../components/list.jsx')
module.exports = IdPage

function IdPage (props) {
  const { match: { params } } = props
  const queryParams = useMemo(() => ({ id: params.id }), [params.id])
  let results = useQuery('entities.allWithId', queryParams)
  if (!results.length) return null
  console.log(results)
  results = L.flatten(results)
  console.log(results)

  return (
    <Wrapper>
      <RecordSetCard records={results} mode={'full'} />
    </Wrapper>
  )
}
