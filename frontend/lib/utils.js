const { Transform } = require('stream')
const { useState, useEffect } = require('react')

module.exports = { debouncedStream, useReadable }

function debouncedStream (rs, opts) {
  const interval = typeof opts === 'number' ? opts : 125

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

  return rs.pipe(ts)
}

function useReadable (stream) {
  const [list, setList] = useState([])

  useEffect(() => {
    setList([])
    const ts = debouncedStream(stream, 100)
    ts.on('data', onData)
    return () => {
      ts.removeListener('data', onData)
    }
  }, [stream])

  function onData (list) {
    setList(oldList => [...oldList, ...list])
  }

  return list
}
