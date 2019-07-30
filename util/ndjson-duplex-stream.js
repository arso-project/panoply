const ndjson = require('ndjson')
const pump = require('pump')
const duplexify = require('duplexify')

module.exports = function ndjsonDuplexStream (stream) {
  const input = ndjson.stringify()
  const output = ndjson.parse()
  pump(input, stream)
  pump(stream, output)
  return duplexify.obj(input, output)
}
