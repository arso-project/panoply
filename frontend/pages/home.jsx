// TODO: ES5 require.
const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const ws = require('websocket-stream')
const queryString = require('query-string')
// const { debounce } = require('lodash')
const cn = require('classnames')

const ndjson = require('../../util/ndjson-duplex-stream')
const { useReadable, useDebounce, IS_SERVER } = require('../lib/utils.js')
const Wrapper = require('../components/wrapper.jsx')

const styles = require('./home.css')

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
  const [results, length] = useQuery('search.query', { query })
  // const onInputChange = useCallback(debounce(e => setQuery(e.target.value), 100), [])
  return (
    <div className={styles.wrap}>
      <div>
        <input type='text' onChange={e => setQuery(e.target.value)} />
      </div>
      <List list={results} length={length} />
    </div>
  )
}

function AllEntities () {
  // const listOpts = useRef({ count: 20, offset: 0 })
  const [results, length] = useQuery('entities.all', {}, {})

  const bySchema = useMemo(() => {
    if (!results.length) return {}
    return results.reduce((acc, row) => {
      acc[row.schema] = acc[row.schema] || []
      acc[row.schema].push(row)
      return acc
    }, {})
  }, [results])
  // console.log(results)

  const [selectedSchema, setSelectedSchema] = useState(null)

  if (!results) return

  function toggleSchema (schema) {
    setSelectedSchema(s => s === schema ? null : schema)
  }

  return (
    <div className={styles.wrap}>
      <ul>
        {Object.keys(bySchema).map(schema => (
          <li key={schema}>
            <h2
              className={cn(styles.title, { [styles.active]: schema === selectedSchema })}
              onClick={e => toggleSchema(schema)}>
              {schemaName(schema)}
            </h2>
          </li>
        ))}
      </ul>
      <div>
        {selectedSchema && (
          <List list={bySchema[selectedSchema]} length={length} />
        )}
      </div>
    </div>
  )

  function schemaName (schema) {
    return schema.split('/')[1]
  }

  // if (!results.length) return null
  // return <List list={results} />
}

function useListHeader (length) {
  const [count, setCount] = useState(20)
  const [offset, setOffset] = useState(0)
  const dOffset = useDebounce(offset, 50)
  const dCount = useDebounce(count, 50)
  const props = { setOffset, setCount, count: dCount, offset: dOffset }
  return props
}

function ListHeader (props) {
  const { length } = props
  const { setOffset, setCount, count, offset } = useListHeader(length)
  return (
    <header>
        Offset:
      <input type='range' min={0} max={length} onChange={e => setOffset(e.target.value)} />
      {offset}
        Count:
      <input type='text' value={count} onChange={e => setCount(e.target.value)} />
      {count}
      <div>
          Length <strong>{length}</strong>
      </div>
    </header>
  )
}

function List (props) {
  const { list } = props

  return (
    <div className={styles.list}>
      {list.map((row, key) => (
        <IntoCard key={key} record={row} />
      ))}
    </div>
  )
}

function IntoCard (props) {
  const { record } = props
  const { id, schema, value, stat } = record
  let ctime
  if (stat) ctime = stat.ctime
  const meta = (
    <dl className={styles.cardMeta}>
      <dt>Schema</dt>
      <dd>{schema}</dd>
      <dt>ID</dt>
      <dd>{id}</dd>
      {ctime && (
        <React.Fragment>
          <dt>ctime</dt>
          <dd>{time(ctime)}</dd>
        </React.Fragment>
      )}
    </dl>
  )

  const fields = {
    title: ['title'],
    body: ['body']
  }

  const matches = {}
  const others = []
  const printed = []

  for (let [name, props] of Object.entries(fields)) {
    for (let prop of props) {
      if (value[prop]) {
        printed.push(prop)
        matches[name] = toString(value[prop])
      }
    }
  }

  if (!matches.title) matches.title = <em>{id}</em>

  for (let [name, val] of Object.entries(value)) {
    if (printed.indexOf(name) > -1) continue
    others.push({
      name, value: toString(val)
    })
  }

  return (
    <Card {...matches} other={others} meta={meta} />
  )

  function time (ts) {
    const d = new Date(ts * 1000)
    return d.toUTCString()
  }

  function toString (value) {
    if (typeof value === 'string' || typeof value === 'number') {
      return value
    } else if (Array.isArray(value)) {
      return (
        <ul>
          {value.map((val, i) => (
            <li key={i}>{toString(val)}</li>
          ))}
        </ul>
      )
    } else if (typeof value === 'object') {
      return <code>{JSON.stringify(value)}</code>
    } else {
      return <em>Cannot display</em>
    }
  }
}

function Card (props) {
  const { title, body, other, meta } = props
  return (
    <article className={styles.card}>
      <h2>{title}</h2>
      <main>{body}</main>
      <dl>
        {other.map(({ name, value }) => (
          <React.Fragment key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <footer>{meta}</footer>
    </article>
  )
}

function useQuery (query, args, opts) {
  let querystring = ''
  if (args) {
    querystring = queryString.stringify(args)
  }
  const stream = useMemo(() => {
    const websocket = ws(baseUrl + '/query/' + query + '?' + querystring)
    const stream = ndjson(websocket)
    return stream
  }, [query, querystring])
  // [list, length]
  const ret = useReadable(stream, opts || {})
  // console.log({ list, length })
  return ret
}

function ListOld (props) {
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
