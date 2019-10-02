// const p = require('path')
const pump = require('pump')
const querystring = require('query-string')
const u = require('url')
// const through = require('through2')
// const crypto = require('crypto')
const hyperdriveHttp = require('hyperdrive-http')

const ndjson = require('./util/ndjson-duplex-stream')
const { collectStream } = require('./util/stream')
const { makeStore } = require('./store')

const mappings = require('./lib/mappings')

const log = require('./lib/log')
const { clock } = require('./util/debug')

if (require.main === module) {
  const opts = extractOptions()
  const server = makeServer(opts)
  console.log(opts)
  server.start()
} else {
  module.exports = makeServer
}

function makeServer (opts) {
  const fastify = require('fastify')({
    logger: log.child({ name: 'fastify' })
  })

  const store = makeStore({
    storage: opts.storage,
    key: opts.key,
    mappings
  })

  store.ready(() => {
    // log.info('Store ready: %s', store.key.toString('hex'))
  })

  fastify.register(require('./frontend/fastify'), {
    ssr: false
    // prefix: '/app'
  })

  fastify.register(require('fastify-websocket'))

  let hyperdriveRequestHandler = new Promise((resolve, reject) => {
    store.writer((err, drive) => {
      if (err) return reject(err)
      const handler = hyperdriveHttp(drive)
      resolve(handler)
    })
  })
  fastify.get('/fs/*', (req, res) => {
    // const path = req.params['*']
    hyperdriveRequestHandler.then(handler => {
      const rawReq = req.req
      rawReq.url = rawReq.url.substring(3) // remove /fs prefix
      handler(rawReq, res.res)
    })
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

    const time = clock()
    log.info('query: %s %o', name, args)

    const [ view, method ] = name.split('.')

    if (!(typeof store.api[view] === 'object' &&
        typeof store.api[view][method] === 'function')) {
      return stream.destroy(new Error('Invalid query name'))
    }

    // TODO: Support higher-level key than api.manifest
    let manifest
    if (store.api[view].manifest) {
      manifest = store.api[view].manifest[method] || store.api[view].manifest.default
    }
    if (!manifest) manifest = 'streaming'
    if (typeof manifest !== 'object') manifest = { type: manifest }

    // TODO: Add safeguards / sanitze user input
    // or formalize query args in other ways.
    const result = store.api[view][method](args)

    if (manifest.type === 'streaming') {
      const transforms = []

      // TODO: Formalize this without special casing.
      if (view === 'entities') {
        transforms.push(store.createGetStream())
      }

      transforms.push(collectStream(100))
      pump(result, ...transforms, stream)
    } else if (manifest.type === 'promise') {
      result
        .then(data => {
          stream.write(data)
          stream.end()
        })
        .catch(err => stream.destroy(err))
    } else {
      stream.destroy(new Error('Unsupported method: ' + name))
    }

    // result.on('end', () => console.log('result end: ', time()))
    // stream.on('end', () => console.log('stream end: ', time()))

    // TODO: Move to websocket middleware.
    // TODO: Propagate errors somewhere else?
    stream.on('error', e => {
      if (e.code && e.code === 'ECONNRESET') return
      log.error(e)
    })
  })

  function start () {
    fastify.listen(opts.port || 9191, 'localhost', (err) => {
      if (err) return console.error(err)
    })
  }

  return {
    fastify, store, start
  }
}

function queryArgs (url) {
  url = u.parse(url)
  let query = {}
  if (url.search) {
    query = { ...querystring.parse(url.search) }
  }
  return query
}

function extractOptions () {
  const argv = require('minimist')(process.argv.slice(2), {
    alias: {
      p: 'port',
      s: 'storage',
      k: 'key'
    }
  })

  console.log(argv)

  const opts = {
    port: argv.port || 9191,
    storage: argv.storage || './data',
    key: argv.key || null
  }

  return opts
}
