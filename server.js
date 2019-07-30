const p = require('path')
const fastify = require('fastify')()
const pump = require('pump')
const querystring = require('query-string')
const u = require('url')
const eos = require('end-of-stream')

const ndjson = require('./util/ndjson-duplex-stream')
const { makeStore } = require('./store')

const store = makeStore('./data')

fastify.register(require('fastify-static'), {
  root: p.join(__dirname, 'build')
})

fastify.register(require('fastify-websocket'))

fastify.get('/batch', { websocket: true }, (rawStream, req, params) => {
  const stream = ndjson(rawStream)
  // TODO: Add auth.
  let ended = false

  eos(stream, () => (ended = true))

  stream.on('data', msg => {
    msg = Array.isArray(msg) ? msg : [msg]
    console.log('batch go', msg)
    store.batch(msg, (err, ids) => {
      console.log('batch', err, ids)
      if (ended) return
      stream.write({ err, ids })
    })
  })
})


fastify.get('/query/:name', { websocket: true }, (rawStream, req, params) => {
  const stream = ndjson(rawStream)

  const { name } = params

  console.log('new connection', name)

  const [ view, method ] = name.split('.')

  if (!(typeof store.api[view] === 'object' && typeof store.api[view][method] === 'function')) {
    stream.destroy(new Error('Invalid query name'))
    return
  }

  const rs = store.api[view][method]()

  // const url = u.parse(req.url)
  // let query = {}
  // if (url.search) {
  //   query = { ...querystring.parse(url.search) }
  // }

  stream.on('error', e => {
    if (e.code && e.code === 'ECONNRESET') return
    console.error(e)
  })

  pump(rs, stream)
})

fastify.listen(9191, 'localhost', (err) => {
  if (err) return console.error(err)
  console.log(`Server listening on http://localhost:9191`)
})
