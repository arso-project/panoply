const { Transform } = require('stream')
const { useState, useEffect, useMemo, useRef } = require('react')
const pump = require('pump')

const IS_SERVER = !(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

module.exports = {
  debouncedStream,
  useReadable,
  useDebounce,
  useDebouncedState,
  useUpdate,
  useSSRTest,
  IS_SERVER
}

function useSSRTest () {
  return 'foo'
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

function useReadable (stream, opts) {
  // if (IS_SERVER) return useReadableSSR(stream, opts)
  let { count = 20, offset = 0 } = opts

  const buf = useMemo(() => [], [stream])

  const list = useMemo(() => {
    if (!count) return [...buf]
    let slice = buf.slice(offset, offset + count)
    return slice
  }, [buf.length, count, offset])

  const debouncedUpdate = useDebouncedUpdate(100)

  useEffect(() => {
    stream.on('data', onData)
    return () => {
      stream.removeListener('data', onData)
      // TODO: Do this here?
      stream.destroy()
    }
  }, [stream])

  return useMemo(() => [list, buf.length], [list, buf.length])

  function onData (item) {
    if (!Array.isArray(item)) item = [item]
    buf.push(...item)
    // if (buf.length > count + offset) return
    debouncedUpdate()
  }
}

function useDebouncedUpdate (interval) {
  const timeout = useRef(null)
  const update = useUpdate()
  function maybeUpdate () {
    if (!timeout.current) {
      timeout.current = setTimeout(() => {
        timeout.current = null
        update()
      }, interval || 50)
    }
  }
  return maybeUpdate
}

function useUpdate () {
  const [counter, setCounter] = useState(0)
  return update
  function update () {
    setCounter(c => c + 1)
  }
}

function useDebounce (value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay]) // Only re-call effect if value or delay changes

  return debouncedValue
}

function useDebouncedState (defaultValue, delay) {
  const [_state, setState] = useState(defaultValue)
  const state = useDebounce(_state, delay)
  return [state, setState]
}
