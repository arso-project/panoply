const leveldb = require('level')
const hypercontent = require('hyper-content-db')
const mkdirp = require('mkdirp')
const p = require('path')
const util = require('util')
const exitHook = require('async-exit-hook')
const localSocketStream = require('./lib/local-socket-stream.js')
const { logEvents } = require('./util/debug')

const hyperswarm = require('@hyperswarm/replicator')
// const hyperdiscovery = require('hyperdiscovery')

const mapView = require('./lib/view-mapping')
const sonarView = require('./lib/view-sonar')

const log = require('./lib/log').child({ name: 'db' })

module.exports = {
  makeStore
}

function makeStore (opts = {}) {
  const basePath = opts.storage
  if (!opts.key) opts.key = null
  const paths = {
    level: p.join(basePath, 'level'),
    corestore: p.join(basePath, 'corestore'),
    sonar: p.join(basePath, 'sonar')
  }

  Object.values(paths).forEach(p => mkdirp.sync(p))

  const level = leveldb(paths.level, 'level')
  const store = hypercontent(paths.corestore, opts.key, {
    level,
    sparse: false
  })

  store.useRecordView('mapView', mapView, { mappings: opts.mappings })
  store.useRecordView('search', sonarView, { storage: paths.sonar })

  store.ready(() => {
    log.info('Database key: %s', store.key.toString('hex'))
    console.log('Database key: %s', store.key.toString('hex'))
  })

  replicate(store)

  return store
}

function replicate (store) {
  store.ready(() => {
    // replicateHyperswarm(store)
    // replicateHyperdiscovery(store)
    replicateLocal(store)
  })
}

// This is a quick hack because hyperswarm keeps
// failing to replicate between two processes
// running on my dev laptop. It checks if socket
// on /tmp/archipel.sock exists, and if so connects
// to it, otherwise opens it. Then the database
// replication stream is passed into it, unencrypted.
// Note that discovery keys are not respected.
function replicateLocal (store) {
  // const name = 'archipel-' + store.discoveryKey.toString('hex')
  const name = 'archipel-replication'
  localSocketStream(name, (err, stream) => {
    if (err) return console.error('cannot setup local replication: ', err)
    const repl = store.replicate({ encrypt: false, live: true })
    repl.pipe(stream).pipe(repl)
  })
}

function replicateHyperswarm (store) {
  const swarm = hyperswarm(store.multidrive.primaryDrive, {
    live: true,
    announce: true,
    lookup: true
  })
  swarm.on('join', dkey => log.debug('Joining swarm for %s', dkey.toString('hex')))
  swarm.on('connection', peer => log.info('New peer'))
  store.sources(drives => {
    for (let drive of drives) {
      swarm.join(drive.discoveryKey)
    }
  })
  store.on('source', drive => {
    swarm.join(drive.discoveryKey)
  })
  logEvents(swarm, 'hyperswarm')
}

// function replicateHyperdiscovery (store) {
//   const swarm = hyperdiscovery(store)
//   store.sources(drives => {
//     for (let drive of drives) {
//       swarm.add(drive)
//     }
//   })
//   // store.on('source', drive => {
//   //   swarm.add(drive)
//   // })
//   logEvents(swarm, 'hyperdiscovery')
// }

function once (fn) {
  let wrapper = (...args) => {
    wrapper = () => {}
    fn(...args)
  }
  return wrapper
}
