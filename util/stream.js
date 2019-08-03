const through = require('through2')

exports.collectStream = function collectStream (cnt) {
  let cache = []
  const cacheLen = cnt || 100
  const collector = through.obj(
    function transform (chunk, enc, done) {
      cache.push(chunk)
      if (cache.length >= cacheLen) {
        this.push(cache)
        cache = []
      }
      done()
    },
    function flush (done) {
      if (cache.length) this.push(cache)
      done()
    }
  )
  return collector
}
