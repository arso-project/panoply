import { useState, useRef, useEffect } from 'react'

import store from '../lib/record-store'

export function useQuery (name, params) {
  // if (IS_SERVER) return useSSRQuery(name, params)
  const [results, setResults] = useDebouncedResultState([], 100)
  useEffect(() => {
    const onchange = results => setResults(results.slice(0))
    const unsubscribe = store.query(name, params, onchange)
    return unsubscribe
  }, [name, params])
  return results
}

export function useCall (name, params) {
  const [result, setResult] = useState()
  useEffect(() => {
    const onchange = result => setResult(result && result.length ? result[0] : undefined)
    const unsubscribe = store.query(name, params, onchange)
    return unsubscribe
  }, [name, params])
  return result
}

export function useDebouncedResultState (defaultValue, timeout = 30) {
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

export function useRecord (link) {
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
