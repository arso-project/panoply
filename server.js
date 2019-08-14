// const p = require('path')
const pump = require('pump')
const querystring = require('query-string')
const u = require('url')
const through = require('through2')
const crypto = require('crypto')
const hyperdriveHttp = require('hyperdrive-http')

const ndjson = require('./util/ndjson-duplex-stream')
const { collectStream } = require('./util/stream')
const { makeStore } = require('./store')

const mappings = require('./lib/mappings')

const log = require('./lib/log')

const fastify = require('fastify')({
  logger: log.child({ component: 'fastify' })
})

const store = makeStore('./data', { mappings })

store.ready(() => {
  log.info('Store ready: %s', store.key.toString('hex'))
})

fastify.register(require('./frontend/fastify'), {
  // prefix: '/ssr'
})

fastify.register(require('fastify-websocket'))

let hyperdriveRequestHandler = new Promise((resolve, reject) => {
  store.writer((err, drive) => {
    if (err) return reject(err)
    console.log('DRIVE', drive.ready)
    const handler = hyperdriveHttp(drive)
    resolve(handler)
  })
})
fastify.get('/fs/*', (req, res) => {
  const path = req.params['*']
  hyperdriveRequestHandler.then(handler => {
    console.log(path)
    const rawReq = req.req
    console.log(rawReq.url)
    rawReq.url = rawReq.url.substring(3)
    handler(rawReq, res.res)
  })
  // rawReq.url
})

fastify.get('/batch', { websocket: true }, (rawStream, req, params) => {
  // TODO: Add auth.
  const stream = ndjson(rawStream)
  const batchStream = store.createBatchStream()
  pump(stream, batchStream, stream)
})

fastify.get('/get', { websocket: true }, (rawStream, req) => {
  const stream = ndjson(rawStream)
  const getStream = store.createGetStream()
  pump(stream, getStream, stream)
})


fastify.get('/hyperdrive/writeFile/*', { websocket: true }, (rawStream, req, params) => {
  const path = params['*']
  // TODO: Check if path is valid.
  // rawStream.on('data', d => console.log('data', d.toString()))
  store.writer((err, drive) => {
    if (err) return rawStream.destroy(err)
    const ws = drive.createWriteStream(path)
    ws.on('close', () => log.debug('Written file: ' + path))
    rawStream.pipe(ws)
  })
})

fastify.get('/hyperdrive/readFile/*', { websocket: true }, (rawStream, req, params) => {
  const path = params['*']
  // TODO: Check if path is valid.
  // rawStream.on('data', d => console.log('data', d.toString()))
  store.writer((err, drive) => {
    if (err) return rawStream.destroy(err)
    const rs = drive.createReadStream(path)
    rs.pipe(rawStream)
  })
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
    pump(queryStream, getStream, collectStream(100), stream)
  } else {
    pump(queryStream, collectStream(100), stream)
  }

  // TODO: Move to websocket middleware.
  stream.on('error', e => {
    if (e.code && e.code === 'ECONNRESET') return
    console.error(e)
  })
})

fastify.listen(9191, 'localhost', (err) => {
  if (err) return console.error(err)
})

function queryArgs (url) {
  url = u.parse(url)
  let query = {}
  if (url.search) {
    query = { ...querystring.parse(url.search) }
  }
  return query
}
