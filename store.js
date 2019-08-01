const leveldb = require('level')
const cstore = require('content-store')
const mkdirp = require('mkdirp')
const p = require('path')

const mapView = require('./lib/view-mapping')
const sonarView = require('./lib/view-sonar')

module.exports = {
  makeStore
}

function makeStore (basePath, opts) {
  const paths = {
    level: p.join(basePath, 'level'),
    corestore: p.join(basePath, 'corestore'),
    sonar: p.join(basePath, 'sonar'),
  }
  Object.values(paths).forEach(p => mkdirp.sync(p))

  const level = leveldb(paths.level, 'level')
  const store = cstore(paths.corestore, null, { level })

  store.useRecordView('mapView', mapView, { mappings: opts.mappings })

  store.useRecordView('search', sonarView, { storage: paths.sonar })

  return store
}
