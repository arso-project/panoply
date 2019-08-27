const ndjson = require('ndjson')
const pump = require('pump')
const duplexify = require('duplexify')
const through = require('through2')
const EOL = require('os').EOL
const fastStringify = require('fast-safe-stringify')

module.exports = function ndjsonDuplexStream (stream) {
  // const input = ndjson.stringify()
  const input = stringify()
  const output = ndjson.parse()
  pump(input, stream)
  pump(stream, output)
  return duplexify.obj(input, output)
}

function stringify () {
  return through.obj(function (obj, enc, next) {
    // const string = fastStringify(obj, replacer)
    const string = fastStringify(obj)
    next(null, string + EOL)
  })
}

// TODO: This together with a matching line
// might be a worthwile micro-optimization.
// function replacer (key, val) {
//   if (typeof val === 'object' && val[JSON_STRING]) {
//     return String(val[JSON_STRING])
//   }
//   return val
// }
