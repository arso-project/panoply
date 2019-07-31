// TODO: ES5 require.
const React = require('react')
const { useMemo, useState } = require('react')
const ReactDOM = require('react-dom')
const ndjson = require('../util/ndjson-duplex-stream')
const ws = require('websocket-stream')
const { useReadable } = require('./lib/utils.js')

const baseUrl = window.location.origin.replace(/^http/, 'ws')

function Page () {
  return <AllEntities />
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

function useQuery (query) {
  const stream = useMemo(() => {
    const websocket = ws(baseUrl + '/query/' + query)
    const stream = ndjson(websocket)
    return stream
  }, [query])
  const list = useReadable(stream)
  return list
}

ReactDOM.render(<Page />, document.getElementById('root'))
