const leveldb = require('level')
const cstore = require('content-store')
const mkdirp = require('mkdirp')
const p = require('path')
const util = require('util')
const { logEvents } = require('./util/debug')

const replicator = require('@hyperswarm/replicator')

const mapView = require('./lib/view-mapping')
const sonarView = require('./lib/view-sonar')

const log = require('./lib/log').child({ component: 'db' })

module.exports = {
  makeStore
}

function makeStore (basePath, opts) {
  const paths = {
    level: p.join(basePath, 'level'),
    corestore: p.join(basePath, 'corestore'),
    sonar: p.join(basePath, 'sonar')
  }

  Object.values(paths).forEach(p => mkdirp.sync(p))

  const level = leveldb(paths.level, 'level')
  const store = cstore(paths.corestore, null, {
    level,
    sparse: false
  })

  store.useRecordView('mapView', mapView, { mappings: opts.mappings })
  store.useRecordView('search', sonarView, { storage: paths.sonar })

  store.ready(() => {
    store.sources(drives => drives.forEach(drive => console.log('SOURCE', drive.key.toString('hex'), drive.writable)))
    const swarm = replicator(store.multidrive.primaryDrive, {
      live: true,
      announce: true,
      lookup: true
    })
    swarm.on('join', dkey => log.info('Joining swarm for %s', dkey.toString('hex')))
    store.sources(drives => {
      for (let drive of drives) {
        swarm.join(drive.discoveryKey)
      }
    })
    store.on('source', drive => {
      swarm.join(drive.discoveryKey)
    })
    logEvents(swarm, 'swarm')
  })

  return store
}
