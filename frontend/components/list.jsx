
const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')

const { useDebouncedState, IS_SERVER } = require('../lib/utils.js')
const { Link } = require('react-router-dom')
const { makeLink } = require('../lib/records.js')

const cn = require('classnames')
const styles = require('./list.css')

export function GroupedList (props) {
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
  const [viewMode, setViewMode] = useState('grid')

  if (!list || !list.length) return null

  return (
    <div className={styles.Wrap}>
      <div>
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
        <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
          <option value='table'>Table</option>
          <option value='grid'>Grid</option>
        </select>
      </div>
      <div>
        {viewMode === 'grid' && <List list={selectedSchema ? grouped[selectedSchema] : list} />}
        {viewMode === 'table' && <Table list={selectedSchema ? grouped[selectedSchema] : list} />}
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

export function useListHeader () {
  const [count, setCount] = useDebouncedState(20, 20)
  const [offset, setOffset] = useDebouncedState(0, 20)
  // const [filter, setFilter] = useState(null, 50)
  const opts = { count, offset }
  const props = { setCount, setOffset }
  return { count, offset, header }
  // return [opts, header]

  function header (length) {
    if (length <= count) return null
    return <ListHeader {...opts} {...props} length={length} />
  }
}

export function ListHeader (props) {
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

export function List (props) {
  const { list } = props
  const { count, offset, header } = useListHeader()

  const slice = useMemo(() => count ? list.slice(offset, offset + count) : list, [list, count, offset])

  if (!list || !list.length) return null

  return (
    <div>
      {header(list.length)}
      <div className={styles.List}>
        {slice.map((row, key) => (
          <RecordCard key={key} record={row} />
        ))}
      </div>
    </div>
  )
}

export function Table (props) {
  const { list } = props
  const { count, offset, header } = useListHeader()
  const slice = useMemo(() => list.slice(offset, count + offset), [list, count, offset])

  const headers = Object.keys(list[0].value)
  return (
    <div>
      {header(list.length)}
      <table>
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {slice.map((row, i) => (
            <tr key={i}>
              {headers.map(h => (
                <td key={h}>
                  {value(row.value[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  function value (val) {
    if (!val) return ''
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      if (val.length > 100) return val.substring(0, 100)
      return val
    }
    return 'unimpl'
  }
}

function EntityCard (props) {
  const { record } = props
  const { id, schema, value, stat } = record
  const { label, files, origin } = value

  let thumbnail
  if (files) {
    let thumbnails = files.filter(f => f.resourceType === 'thumbnail')
    if (thumbnails.length) thumbnail = makeFileLink(thumbnails[0].link)
  }

  let renderedFiles = !(files && files.length) ? null : (
    <ul>
      {files.map((file, i) => (
        <li key={i}>
          <strong>{file.resourceType}</strong>
          <a href={makeFileLink(file.link)}>{file.link}</a>
        </li>
      ))}
    </ul>
  )

  return (
    <Card
      {...props}
      body={(<div>
        {renderedFiles}
        <KeyValueObject data={origin} />
      </div>)}
      title={label}
      thumbnail={thumbnail}
    />
  )
}

function Meta (props) {
  const { record } = props
  const { id, schema, value, stat } = record
  let ctime
  if (stat) ctime = stat.ctime

  const meta = (
    <dl className={styles.Meta}>
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
  return meta

  function time (ts) {
    const d = new Date(ts * 1000)
    return d.toUTCString()
  }
}

function RecordCard (props) {
  const { record } = props
  const { id, schema, value, stat } = record
  const meta = <Meta record={record} />
  const link = '/id/' + id
  if (schema === 'arso.xyz/Entity') {
    return <EntityCard record={record} meta={meta} link={link} />
  } else {
    return <UnknownCard record={record} meta={meta} link={link} />
  }
}

function makeFileLink (path) {
  return '/fs' + path
}

function UnknownCard (props) {
  const { record } = props
  const { id, schema, value, stat } = record

  const link = '/id/' + id

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
    <Card {...props} {...matches} other={others} link={link} />
  )

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
    return String(value)
  } else return JSON.stringify(value)
}

function KeyValueObject (props) {
  const { data } = props
  if (typeof data !== 'object') return null
  let transformed = Object.entries(data).map(([key, value]) => ({
    name: key,
    value
  }))
  return <KeyValue data={transformed} />
}

function KeyValue (props) {
  let { data } = props
  if (!data) return null
  return (
    <dl className={styles.KeyValue}>
      {data.map(({ name, value }) => (
        <React.Fragment key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

function Card (props) {
  const { title, body, other, meta, link, thumbnail } = props
  return (
    <article className={styles.Card}>
      {link && <Link to={link}><h2>{title}</h2></Link>}
      {!link && <h2>{title}</h2>}
      {thumbnail && <img src={thumbnail} />}
      <main>{body}</main>
      <div>
        { other && <KeyValue data={other} />}
      </div>
      <footer>{meta}</footer>
    </article>
  )
}
