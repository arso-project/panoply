// TODO: ES5 require.
const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const ws = require('websocket-stream')
const queryString = require('query-string')
// const { debounce } = require('lodash')
const cn = require('classnames')

const ndjson = require('../../util/ndjson-duplex-stream')
const { useReadable, useDebouncedState, IS_SERVER } = require('../lib/utils.js')
const { useQuery } = require('../lib/records.js')
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
  const params = useMemo(() => ({ query }), [query])
  const results = useQuery('search.query', params)
  // const onInputChange = useCallback(debounce(e => setQuery(e.target.value), 100), [])
  return (
    <div className={styles.wrap}>
      <div>
        <input type='text' onChange={e => setQuery(e.target.value)} />
      </div>
      <GroupedList list={results} />
    </div>
  )
}

function AllEntities () {
  const results = useQuery('entities.all')
  useEffect(() => {
    if (results.length === 0) console.time('entities')
    if (results.length >= 1000) console.timeEnd('entities')
  }, [results.length])
  return <GroupedList list={results} />
}

function GroupedList (props) {
  const { list } = props

  const grouped = useMemo(() => {
    if (!list.length) return {}
    return list.reduce((acc, row) => {
      acc[row.schema] = acc[row.schema] || []
      acc[row.schema].push(row)
      return acc
    }, {})
  }, [list])

  const [selectedSchema, setSelectedSchema] = useState(null)

  if (!list || !list.length) return null

  return (
    <div className={styles.wrap}>
      <ul>
        {Object.keys(grouped).map(schema => (
          <li key={schema}>
            <h2
              className={cn(styles.title, { [styles.active]: schema === selectedSchema })}
              onClick={e => toggleSchema(schema)}>
              {schemaName(schema)} <em>{grouped[schema].length}</em>
            </h2>
          </li>
        ))}
      </ul>
      <div>
        <List list={selectedSchema ? grouped[selectedSchema] : list} />
      </div>
    </div>
  )

  function schemaName (schema) {
    return schema.split('/')[1]
  }

  function toggleSchema (schema) {
    setSelectedSchema(s => s === schema ? null : schema)
  }

  // if (!results.length) return null
  // return <List list={results} />
}

function useListHeader () {
  const [count, setCount] = useDebouncedState(20, 20)
  const [offset, setOffset] = useDebouncedState(0, 20)
  // const [filter, setFilter] = useState(null, 50)
  const opts = { count, offset }
  const props = { setCount, setOffset }
  return { count, offset, header }
  // return [opts, header]

  function header (length) {
    return <ListHeader {...opts} {...props} length={length} />
  }
}

function ListHeader (props) {
  // const [filterText, setFilterText] = useState('')
  const { setOffset, setCount, count, offset, length } = props
  return (
    <header>
      <div>
        Offset:
        <input type='range' min={0} max={length - count} onChange={e => setOffset(parseInt(e.target.value))} />
        {offset}
      </div>
      <div>
        Count:
        <input type='range' min={1} max={100} value={count} onChange={e => setCount(parseInt(e.target.value))} />
        {count}
      </div>
      <div>
          Length <strong>{length}</strong>
      </div>
    </header>
  )

  // function onFilterChange (text) {
  //   setFilterText(text)
  //   setFilter(() => {
  //     return (record) => {
  //       console.log('filter', record)
  //       if (!record.value.title) return
  //       let stringTitle = forceToString(record.value.title).toLowerCase()
  //       return stringTitle.includes(text.toLowerCase)
  //     }
  //   })
  // }
}

function List (props) {
  const { list } = props
  const { count, offset, header } = useListHeader()

  const slice = useMemo(() => count ? list.slice(offset, offset + count) : list, [list, count, offset])

  if (!list || !list.length) return null

  return (
    <div>
      {header(list.length)}
      <div className={styles.list}>
        {slice.map((row, key) => (
          <IntoCard key={key} record={row} />
        ))}
      </div>
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

function forceToString (value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  } else return JSON.stringify(value)
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

// function useQuery (query, args, opts) {
//   let querystring = ''
//   if (args) {
//     querystring = queryString.stringify(args)
//   }
//   const stream = useMemo(() => {
//     const websocket = ws(baseUrl + '/query/' + query + '?' + querystring)
//     const stream = ndjson(websocket)
//     return stream
//   }, [query, querystring])
//   // [list, length]
//   const ret = useReadable(stream, opts || {})
//   // console.log({ list, length })
//   return ret
// }

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
