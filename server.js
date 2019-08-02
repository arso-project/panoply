const p = require('path')
const pump = require('pump')
const querystring = require('query-string')
const u = require('url')

const ndjson = require('./util/ndjson-duplex-stream')
const { makeStore } = require('./store')

const mappings = require('./lib/mappings')

const log = require('./lib/log')

const fastify = require('fastify')({
  logger: log.child({ component: 'fastify' })
})

const store = makeStore('./data', { mappings })

// fastify.register(require('fastify-static'), {
//   root: p.join(__dirname, 'frontend', 'build')
// })

fastify.register(require('./frontend/fastify'), {
  // prefix: '/ssr'
})

fastify.register(require('fastify-websocket'))

fastify.get('/batch', { websocket: true }, (rawStream, req, params) => {
  // TODO: Add auth.
  const stream = ndjson(rawStream)
  // stream.on('data', d => console.log('msg', d))
  const batchStream = store.createBatchStream()
  pump(stream, batchStream, stream)
})

fastify.get('/query/:name', { websocket: true }, (rawStream, req, params) => {
  const stream = ndjson(rawStream)

  const { name } = params
  const args = queryArgs(req.url)

  console.log('new connection', name, args)

  const [ view, method ] = name.split('.')

  if (!(typeof store.api[view] === 'object' &&
      typeof store.api[view][method] === 'function')) {
    return stream.destroy(new Error('Invalid query name'))
  }

  // TODO: Add safeguards / sanitze user input
  // or formalize query args in other ways.
  const queryStream = store.api[view][method](args)
  const getStream = store.createGetStream()

  // TODO: Formalize this without special casing.
  if (view === 'entities') {
    pump(queryStream, getStream, stream)
  } else {
    pump(queryStream, stream)
  }

  // TODO: Move to websocket middleware.
  stream.on('error', e => {
    if (e.code && e.code === 'ECONNRESET') return
    console.error(e)
  })
})

fastify.listen(9191, 'localhost', (err) => {
  if (err) return console.error(err)
  console.log(`Server listening on http://localhost:9191`)
})

function queryArgs (url) {
  url = u.parse(url)
  let query = {}
  if (url.search) {
    query = { ...querystring.parse(url.search) }
  }
  return query
}
