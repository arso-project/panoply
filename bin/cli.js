const minimist = require('minimist')
const ws = require('websocket-stream')
const duplexify = require('duplexify')
const pump = require('pump')

const ndjson = require('../util/ndjson-duplex-stream')

const argv = minimist(process.argv.slice(2), {
})

// todo: auth

const baseUrl = 'http://localhost:9191'

put(() => {
  query(() => {
    console.log('done')
  })
})

function put (cb) {
  const socket = ws(baseUrl + '/batch')
  const stream = ndjson(socket)

  const records = [
    {
      op: 'put',
      schema: 'event',
      value: {
        date: new Date(2019, 12, 10),
        title: 'Archipel v2 prerelease'
      }
    },
    {
      op: 'put',
      schema: 'event',
      value: {
        date: new Date(2019, 9, 2),
        title: 'Another date'
      }
    }
  ]

  stream.write(records)

  stream.on('data', data => {
    console.log('batch result', data)
    cb()
  })
}

function query (cb) {
  const stream = ndjson(ws(baseUrl + '/query/entities.all'))
  stream.on('data', row => {
    console.log('query', row)
  })
  stream.on('error', err => {
    console.error('error', err)
    cb(err)
  })
  stream.on('end', cb)
}
