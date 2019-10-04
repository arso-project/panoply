import { useState, useEffect, useMemo, useRef } from 'react'

export function useReadable (stream, opts = {}) {
  const { count = 20, offset = 0, reverse = false } = opts

  const buf = useMemo(() => [], [stream])

  const list = useMemo(() => {
    if (!count) return [...buf]
    let slice
    if (!reverse) {
      slice = buf.slice(offset, offset + count)
    } else {
      slice = buf.slice(buf.length - count - offset, buf.length - offset)
    }
    return slice
  }, [buf.length, count, offset, reverse])

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

export function useDebouncedUpdate (interval) {
  const timeout = useRef(-1)
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

export function useUpdate () {
  const [_counter, setCounter] = useState(0)
  return update
  function update () {
    setCounter(c => c + 1)
  }
}

export function useDebounce (value, delay) {
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

export function useDebouncedState (defaultValue, delay) {
  const [_state, setState] = useState(defaultValue)
  const state = useDebounce(_state, delay)
  return [state, setState]
}
