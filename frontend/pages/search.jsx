const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const { useQuery, useCall } = require('../lib/records.js')
const Wrapper = require('../components/wrapper.jsx')

const { Link } = require('../components/link.jsx')
const { List } = require('../components/list.jsx')
const { makeLink } = require('../lib/records.js')

const cn = require('classnames')

const styles = require('./search.css')

module.exports = Page

function Page (props) {
  return (
    <Wrapper {...props}>
      <Search />
    </Wrapper>
  )
}

function Search () {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState('textdump')
  const params = useMemo(() => ({
    query,
    index
  }), [query, index])
  const results = useQuery('search.query', params)
  const info = useCall('search.info') || {}
  return (
    <div className={'hello ' + styles.Wrap}>
      <div className={styles.Form}>
        <input type='text' onChange={e => setQuery(e.target.value)} />
        <select value={index} onChange={e => setIndex(e.target.value)}>
          {Object.entries(info).map(([name, info]) => (
            <option key={name} value={name}>{schemaName(name)}</option>
          ))}
        </select>
      </div>

      <SearchList list={results} />
    </div>
  )
}

function SearchList (props) {
  const { list } = props
  return (
    <ul className={styles.List}>
      {list.map((row, i) => (
        <li key={i}>
          <Row record={row} />
        </li>
      ))}
    </ul>
  )
}

function Row (props) {
  const { record } = props
  return (
    <div className={styles.Row}>
      <h2>
        <Link to={'/id/' + record.id}>
          {record.value.title}
        </Link>
      </h2>
      <Meta record={record} />
      <Snippet snippet={record.value.snippet} />
    </div>
  )
}

function Meta (props) {
  const { record } = props
  return (
    <div className={styles.Meta}>
      <strong>{schemaName(record.schema)}</strong>
      <span>{record.id}</span>
    </div>
  )
}

function Snippet (props) {
  const { snippet } = props
  if (!snippet) return null
  const [before, highlight, after] = snippet.split(/<\/?b>/)
  return (
    <div className={styles.Snippet}>
      <span>{before}</span>
      <strong>{highlight}</strong>
      <span>{after}</span>
    </div>
  )
}

// TODO: Make better & standardize.
function schemaName (schema) {
  if (schema.indexOf('/') === -1) return schema
  return schema.split('/')[1]
}
