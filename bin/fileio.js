const ws = require('websocket-stream')
const { Readable } = require('stream')
const minimist = require('minimist')

const baseUrl = 'http://localhost:9191'

const argv = minimist(process.argv.slice(2), {
  boolean: 'v',
  alias: {
    v: 'verbose'
  }
})

const [mode, path] = argv._
if (!path) usage()

let op
if (mode === 'r') {
  op = 'hyperdrive/readFile'
} else if (mode === 'w') {
  op = 'hyperdrive/writeFile'
} else {
  usage()
}

const url = [baseUrl, op, path].join('/')
log('URL: ' + url)
const stream = ws(url, {
  perMessageDeflate: false
})

let clientStream
if (mode === 'w') {
  clientStream = process.stdin
  clientStream.pipe(stream)
} else if (mode === 'r') {
  clientStream = process.stdout
  stream.pipe(clientStream)
} else {
  usage()
}

clientStream.on('error', err => console.error('Client stream', err))

stream.on('error', err => log('Socket', err))
stream.on('close', () => log('stream closed'))

function exit (...msgs) {
  console.log(...msgs)
  process.exit(1)
}

function usage () {
  exit(`Usage: node fileio.js MODE PATH 

Arguments:
  MODE r to read, w to write
  PATH filepath
`)
}

function log (...args) {
  console.error('LOG')
  if (argv.verbose) console.error(...args)
}
