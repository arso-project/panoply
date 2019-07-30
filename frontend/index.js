// TODO: ES5 require.
import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import ndjson from '../util/ndjson-duplex-stream'
import ws from 'websocket-stream'
import { useReadable } from './lib/utils.js'

const baseUrl = window.location.origin.replace(/^http/, 'ws')

function Page () {
  const list = useQuery('entities.all')
  if (!list.length) return <em>Nothing</em>
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
    return Object.entries(row).map(([key, value]) => {
      if (skip.indexOf(key) >= 0) return null
      return (
        <div key={key}>
          <strong>{key}</strong>:
          <code>{JSON.stringify(value)}</code>
        </div>
      )
    })
  }
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
