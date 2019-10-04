import React from 'react'
import Wrapper from '../components/Wrapper.js'
import ws from 'websocket-stream'

import logger from '../lib/log.js'
import ndjson from '../../../util/ndjson-duplex-stream'
import { useReadable } from '../hooks'

const log = logger('importer')

const CONFIG = {
  baseUrl: 'ws://localhost:9192/'
}

function makeClient (config) {
  const client = ndjson(ws(config.baseUrl + '/api'))
  client.on('error', err => log.error('Importer error', err))
  return client
}

const client = makeClient(CONFIG)

export default function ImporterPage (props) {
  return (
    <Wrapper>
      <h1>Importer</h1>
      <Importer client={client} />
    </Wrapper>
  )
}

function Importer (props) {
  const { client } = props
  return (
    <form onSubmit={onFormSubmit}>
      <input type='text' name='url' placeholder='Enter URL ...' />
      <button type='submit'>Start</button>
      <Status client={client} />
    </form>
  )

  function onFormSubmit (e) {
    let data = formData(e.currentTarget)
    let url = data.url
    client.write({
      url
    })
  }
}

function Status (props) {
  const { client } = props
  const [list, length] = useReadable(client)
  if (!list) return null
  return (
    <ul>
      {list.map((item, i) => (
        <li key={i}>{JSON.stringify(item)}</li>
      ))}
    </ul>
  )
}

function formData (form) {
  let fd = new FormData(form)
  let data = {}
  for (let [k, v] of fd.entries()) {
    data[k] = v
  }
  return data
}
