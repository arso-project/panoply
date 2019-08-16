// TODO: ES5 require.
const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const { useQuery, useCall } = require('../lib/records.js')
const Wrapper = require('../components/wrapper.jsx')

const { GroupedList } = require('../components/list.jsx')

const cn = require('classnames')

const styles = require('./home.css')


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
  const [index, setIndex] = useState('textdump')
  const params = useMemo(() => ({
    query,
    index
  }), [query, index])
  const results = useQuery('search.query', params)
  const info = useCall('search.info') || {}
  // const onInputChange = useCallback(debounce(e => setQuery(e.target.value), 100), [])
  return (
    <div className={styles.wrap}>
      <div>
        <input type='text' onChange={e => setQuery(e.target.value)} />
        <select value={index} onChange={e => setIndex(e.target.value)}>
          {Object.entries(info).map(([name, info]) => (
            <option key={name} value={name}>{schemaName(name)}</option>
          ))}
        </select>
      </div>
      <GroupedList list={results} />
    </div>
  )

  // TODO: Make better & standardize.
  function schemaName (schema) {
    if (schema.indexOf('/') === -1) return schema
    return schema.split('/')[1]
  }
}

function AllEntities () {
  const results = useQuery('entities.all')
  useEffect(() => {
    if (results.length === 0) console.time('entities')
    if (results.length >= 1000) console.timeEnd('entities')
  }, [results.length])
  return <GroupedList list={results} />
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
