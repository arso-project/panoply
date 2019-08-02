const { Transform } = require('stream')
const { useState, useEffect } = require('react')
const pump = require('pump')

const IS_SERVER = !(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

module.exports = {
  debouncedStream,
  useReadable,
  IS_SERVER
}

function debouncedStream (rs, opts) {
  const interval = typeof opts === 'number' ? opts : 10

  let clear
  let cache = []

  const ts = new Transform({
    objectMode: rs._readableState.objectMode,
    transform (chunk, enc, next) {
      if (!clear) clear = setInterval(flush, interval)
      cache.push(chunk)
      next()
    }
  })

  clear = setInterval(flush, interval)

  rs.on('end', () => {
    clearInterval(clear)
    flush()
  })

  function flush () {
    if (!cache.length) return
    ts.push(cache)
    cache = []
  }

  return pump(rs, ts)
}

function collectStream (stream, cb) {
  let buf = []
  let ret
  if (!cb) {
    ret = new Promise((resolve, reject) => {
      cb = (err, buf) => err ? reject(err) : resolve(buf)
    })
  }
  stream.on('data', d => buf.push(d))
  stream.on('error', err => cb(err))
  stream.on('end', () => cb(null, buf))
  return ret
}

function useReadable (stream) {
  let [list, setList] = useState([])

  useEffect(() => {
    setList([])
    const ts = debouncedStream(stream)
    ts.on('data', onData)
    return () => {
      ts.removeListener('data', onData)
      // TODO: Do this here?
      ts.destroy()
    }
  }, [stream])

  function onData (list) {
    setList(oldList => [...oldList, ...list])
  }

  return list
}

