const p = require('path')
const u = require('url')
const fastify = require('fastify')()
const { Readable } = require('stream')
const pump = require('pump')
const ndjson = require('ndjson')
const querystring = require('query-string')
const { makestore } = require('./store')
const store = makestore('./data')

fastify.register(require('fastify-static'), {
  root: p.join(__dirname, 'build')
})

fastify.register(require('fastify-websocket'))

fastify.get('/query/:name', { websocket: true }, (stream, req, params) => {
  const { name } = params
  const [ view, method ] = name.split('.')

  if (!(typeof store.api[view] === 'object' && typeof store.api[view][method] === 'function')) {
    stream.destroy(new Error('Invalid query name'))
    return
  }

  const rs = store.api[view][method]()

  //  const url = u.parse(req.url)

  //let query = {}
  //if (url.search) {
  //  query = { ...querystring.parse(url.search) }
  //}

  console.log('new connection', name)

  stream.on('error', e => {
    if (e.code && e.code === 'ECONNRESET') return
    console.error(e)
  })

  pump(rs, ndjson.serialize(), stream)
})

fastify.listen(9191, 'localhost', (err) => {
  if (err) return console.error(err)
  console.log(`Server listening on http://localhost:9191`)
})
