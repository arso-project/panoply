// TODO: ES5 require.
const React = require('react')
const { useMemo, useState, useCallback } = require('react')
const ws = require('websocket-stream')
const queryString = require('query-string')
// const { debounce } = require('lodash')

const Wrapper = require('./wrapper.jsx')

const { useReadable, IS_SERVER } = require('../lib/utils.js')
const ndjson = require('../../util/ndjson-duplex-stream')

const baseUrl = IS_SERVER
  ? process.env.ARCHIPEL_API_URL || 'ws://localhost:9191'
  : window.location.origin.replace(/^http/, 'ws')

module.exports = Page

function Page (props) {
  return (
    <Wrapper {...props}>
      <Search />
      <AllEntities />
    </Wrapper>
  )
}

function Search () {
  const [query, setQuery] = useState('')
  const results = useQuery('search.query', { query })
  // const onInputChange = useCallback(debounce(e => setQuery(e.target.value), 100), [])
  return (
    <div>
      <input type='text' onChange={e => setQuery(e.target.value)} />
      <List list={results} />
    </div>
  )
}

function AllEntities () {
  const results = useQuery('entities.all')

  const bySchema = useMemo(() => {
    if (!results.length) return {}
    return results.reduce((acc, row) => {
      acc[row.schema] = acc[row.schema] || []
      acc[row.schema].push(row)
      return acc
    }, {})
  }, [results])
  console.log(results)

  const [selectedSchema, setSelectedSchema] = useState(null)

  function toggleSchema (schema) {
    setSelectedSchema(s => s === schema ? null : schema)
  }

  return (
    <ul>
      {Object.keys(bySchema).map(schema => (
        <li key={schema}>
          <h2 onClick={e => toggleSchema(schema)}>
            {schema}
          </h2>
          {schema === selectedSchema && (
            <List list={bySchema[schema].slice(0, 100)} />
          )}
        </li>
      ))}
    </ul>
  )

  // if (!results.length) return null
  // return <List list={results} />
}

function List (props) {
  const { list } = props
  return (
    <ul>
      {list.map((row, key) => (
        <li key={key}>
          {entry(row.value)}
          <small>
            {entry(row, ['value'])}
          </small>
        </li>
      ))}
    </ul>
  )

  function entry (row, skip = []) {
    if (typeof row === 'string' || typeof row === 'number') return row
    if (!row) return null
    // return <pre>{JSON.stringify(row, 0, 2)}</pre>
    return Object.entries(row).map(([key, value]) => {
      if (skip.indexOf(key) >= 0) return null
      return (
        <div key={key}>
          <strong>{key}</strong>:
          <pre>{JSON.stringify(value, 0, 2)}</pre>
        </div>
      )
    })
  }
}

// function toCard (record) {
//   const { id, schema, value, stat: { ctime } } = record
// }

function Card (props) {
  const { title, main, meta } = props
  return (
    <article>
      <h2>{title}</h2>
      <p>{main}</p>
      <footer>{meta}</footer>
    </article>
  )
}

function useQuery (query, args) {
  let querystring = ''
  if (args) {
    querystring = queryString.stringify(args)
  }
  const stream = useMemo(() => {
    const websocket = ws(baseUrl + '/query/' + query + '?' + querystring)
    const stream = ndjson(websocket)
    return stream
  }, [query, querystring])
  const list = useReadable(stream)
  return list
}
