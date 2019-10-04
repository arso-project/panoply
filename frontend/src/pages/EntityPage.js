const React = require('react')
const { useMemo } = require('react')
const { useQuery } = require('../hooks/records.js')
const L = require('lodash')

const Wrapper = require('../components/Wrapper.js')
const { List, RecordSetCard } = require('../components/List.js')

const styles = require('./id.css')

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
      <RecordSetCard records={results} viewMode='full' />
    </Wrapper>
  )
}
