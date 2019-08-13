// TODO: ES5 require.
const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const { useQuery } = require('../lib/records.js')
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
