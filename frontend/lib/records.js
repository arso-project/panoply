const u = require('url')
const { Readable, Writable, Transform } = require('stream')
const duplexify = require('duplexify')
const queryString = require('query-string')
const ws = require('websocket-stream')
const ndjson = require('../../util/ndjson-duplex-stream')
const { IS_SERVER } = require('./utils.js')
const L = require('lodash')
const React = require('react')
const { useState, useMemo, useRef, useEffect } = require('react')

class Store {
  constructor () {
    this.records = {}
    this.awaiting = {}
    this.by = {}
    this.queries = {}
    this._createStream()
  }

  _createStream () {
    const rs = new Readable({
      objectMode: true,
      read () {}
    })
    const ws = new Writable({
      objectMode: true,
      write: (chunk, encoding, done) => {
        if (Array.isArray(chunk)) {
          chunk.forEach(record => this.put(record))
        } else this.put(chunk)
      }
    })
    const ds = duplexify(ws, rs)
    this.stream = ds
  }

  put (record) {
    // const { schema, id, source } = record
    const link = makeLink(record)
    this.records[link] = record
    this.index(record)
    if (this.awaiting[link]) {
      this.awaiting[link].forEach(waiter => waiter.resolve(record))
      delete this.awaiting[link]
    }
    return link
  }

  index (record) {
    const { schema, id, source } = record
    pushToObject(this.by, { schema, id, source })
  }

  get (link) {
    if (typeof link === 'object') link = makeLink(link)
    return this.records[link]
  }

  query (name, params, cb) {
    // const [promise, resolve] = makePromise()
    const query = this._makeQuery(name, params)

    const onchange = (results) => {
      cb(results.map(l => this.get(l)))
    }

    query.subscribe(onchange)

    return () => query.unsubscribe(onchange)
    // return promise
  }

  querySlice (name, params, opts = {}) {
    const { count = 20, offset = 0 } = opts
    const query = this._makeQuery(name, params)
    const [promise, resolve] = makePromise()
    const onchange = results => {
      if (results.length > offset + count) {
        let slice = results.slice(offset, offset + count)
        query.unsubscribe(onchange)
        resolve(slice.map(l => this.get(l)))
      }
    }
    query.subscribe(onchange)
    return promise
  }

  _makeQuery (name, params) {
    const querystring = queryString.stringify(params)
    let path = name
    if (querystring) path = path + '?' + querystring

    if (this.queries[path]) return this.queries[path]

    const results = []
    const subscribers = new Set()

    const subscribe = fn => {
      fn(results)
      subscribers.add(fn)
    }
    const unsubscribe = fn => {
      subscribers.delete(fn)
    }

    const stream = openStream('/query/' + path)
    // const transform = new Transform({
    //   objectMode: true,
    //   transform (chunk, encoding, next) {
    //   }
    // })

    // stream.pipe(transform)

    const query = { results, subscribers, subscribe, unsubscribe, stream }

    stream.on('data', (chunk) => {
      if (!Array.isArray(chunk)) chunk = [chunk]
      for (let record of chunk) {
        const link = this.put(record)
        results.push(link)
      }
      subscribers.forEach(fn => fn(results))
    })

    stream.on('end', () => {
      // TODO: Cleanup
      delete query.stream
    })

    this.queries[path] = query

    return query
  }

  all () {
    return this.records
  }

  load (link, opts) {
    const [promise, resolve, reject] = makePromise()
    link = makeLink(link)
    if (this.get(link)) {
      resolve(this.get(link))
    } else {
      this.awaiting[link] = this.awaiting[link] || []
      this.awaiting[link].push({ resolve, reject })
      this.stream.push(link)
    }
    return promise
  }
}

const store = new Store()
if (!IS_SERVER) {
  window.__store__ = store
}

module.exports = { store, useQuery, useRecord, makeLink, parseLink }

function useQuery (name, params) {
  // if (IS_SERVER) return useSSRQuery(name, params)
  const [results, setResults] = useDebouncedResultState([], 100)
  useEffect(() => {
    const onchange = results => setResults(results.slice(0))
    const unsubscribe = store.query(name, params, onchange)
    return unsubscribe
  }, [name, params])
  return results
}

// function useSSRQuery (name, params) {
//   let promise = store.querySlice(name, params)
//   let results
//   promise.then(r => (results = r)).catch(e => (results = []))
//   setTimeout(() => (results = []), 100)
//   while (!results) {}
//   return results
// }

function useDebouncedResultState (defaultValue, timeout = 30) {
  const [results, _setResults] = useState(defaultValue)
  const bouncer = useRef({ bouncer: null, results: null })

  useEffect(() => {
    return () => clearTimeout(bouncer.current.timeout)
  }, [])

  function setResults (nextResults) {
    bouncer.current.results = nextResults
    if (!bouncer.current.timeout) onTimeout()
  }

  function onTimeout () {
    if (bouncer.current.results) {
      _setResults(bouncer.current.results)
      bouncer.current.timeout = setTimeout(onTimeout, timeout)
    } else {
      bouncer.current.timeout = null
    }
    bouncer.current.results = null
  }

  return [results, setResults]
}

function useRecord (link) {
  const [record, setRecord] = useState(null)
  useEffect(() => {
    let mount = true
    store.load(link).then(record => {
      if (mount) setRecord(record)
    })
    return () => (mount = false)
  })
  return record
}

function makePromise () {
  let resolve, reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return [promise, resolve, reject]
}

function pushToObject (obj, keys) {
  for (let [key, value] of Object.entries(keys)) {
    if (!obj[key]) obj[key] = []
    obj[key].push(value)
  }
}

function parseLink (link) {
  if (typeof link === 'object') {
    if (!link.id) throw new Error('Invalid link: no id', link)
    return link
  }
  const url = u.parse(link)
  const path = url.pathname
  const parts = path.split('/').filter(f => f)
  if (parts.length !== 4 || parts[0] !== '.data') throw new Error('Invalid path' + link)
  const schema = parts[1] + '/' + parts[2]
  const id = parts[3].split('.').slice(0, -1).join('.')
  const source = url.hostname
  return { id, schema, source }
}

function makeLink (parts) {
  if (typeof parts === 'string') return parts
  const { id, schema, source } = parts
  const path = ['.data', schema, id].join('.')
  return `dat://${source}/${path}.json`
}

const baseUrl = IS_SERVER
  ? process.env.ARCHIPEL_API_URL || 'ws://localhost:9191'
  : window.location.origin.replace(/^http/, 'ws')

function openStream (path) {
  const websocket = ws(baseUrl + path)
  const stream = ndjson(websocket)
  return stream
}