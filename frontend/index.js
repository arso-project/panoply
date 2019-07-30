import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import ndjson from '../util/ndjson-duplex-stream'
import ws from 'websocket-stream'

const baseUrl = 'ws://localhost:9191'
  
function Page () {
  const [results, setResults] = useState([])
  useMemo(() => { useQuery(results, setResults)}, [])
  return <div>
    <p>H</p>
    <p>{results}</p>
  </div>
}

function useQuery (data, setData) {
  const coll = []
  const websocket = ws(baseUrl + '/query/entities.all')
  const stream = ndjson(websocket)
  stream.on('data', row => {
    console.log('query', row)
    coll.push(row)
  })
  stream.on('error', err => {
    console.error('error', err)
  })
  stream.on('end', () => {
    setData(JSON.stringify(coll))
  })
  return data
}

ReactDOM.render(<Page />, document.getElementById('root'))


