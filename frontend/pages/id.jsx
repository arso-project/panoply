const React = require('react')
const { useMemo, useState, useCallback } = require('react')
const Wrapper = require('../components/wrapper.jsx')
const styles = require('./id.css')
const { useQuery } = require('../lib/records.js')

const { List } = require('../components/list.jsx')
module.exports = IdPage

function IdPage (props) {
  const { match: { params } } = props
  const queryParams = useMemo(() => ({ id: params.id }), [params.id])
  const results = useQuery('entities.allWithId', queryParams)
  console.log(results)
  return (
    <Wrapper>
      <h1 className={styles.title}>
        Id page
      </h1>
      <p>
        id: { params.id }
      </p>
      <List list={results} />
    </Wrapper>
  )
}
