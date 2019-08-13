const fs = require('fs')
const ws = require('websocket-stream')
const ndjson = require('../util/ndjson-duplex-stream')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2), {
  alias: {
    s: 'schema',
    f: 'from',
    t: 'to',
    p: 'path'
  }
})

if (!argv._.length) {
  exit(`Usage: node example-json -s schema FILE

Arguments:
  FILE  Path to a JSON file. Should be an array of records.

Options:
  -s, --schema: Schema string
  -f, --from: Start index
  -t, --to: End index
  -p, --path: JSON path
`)
}

const schema = argv.schema
const filename = argv._[0]

if (!schema) exit('Schema is required.')
if (!filename || !fs.existsSync(filename)) exit('File not found.')

const baseUrl = 'http://localhost:9191'
const batch = ndjson(ws(baseUrl + '/batch'))

let json
try {
  json = JSON.parse(fs.readFileSync(filename))
} catch (err) {
  exit('Invalid json.', err)
}

if (argv.path && !json[argv.path]) exit('Invalid JSON path')
else if (argv.path) json = json[argv.path]
if (!Array.isArray(json)) exit('Not an array.')

json = json.slice(argv.from || 0, argv.to || undefined)

const data = json.map(value => {
  return {
    op: 'put',
    schema,
    value
  }
})

console.log('data length', data.length)

const chunkSize = 100
for (let i = 0; i <= data.length; i = i + chunkSize) {
  let slice = data.slice(i, i + chunkSize)
  batch.write(slice)
}
// batch.end()

let totals = []
batch.on('data', ids => {
  totals = totals.concat(ids)
  console.log(`Written ${ids.length}`)
  // TODO: This should receive an end event or similar from the stream.
  if (totals.length === data.length) {
    console.log('All done.')
    process.exit(0)
  }
})

// TODO: This does not happen.
// batch.on('end', () => {
//   console.log(`Finished. Written ${totals.length}`)
// })

batch.on('error', err => console.error('error', err))

function exit (...msgs) {
  console.log(...msgs)
  process.exit(1)
}
