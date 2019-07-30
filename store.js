const leveldb = require('level')
const cstore = require('content-store')
const mkdirp = require('mkdirp')
const p = require('path')

module.exports = {
  makeStore
}

function makeStore (basePath) {
  const paths = {
    level: p.join(basePath, 'level'),
    corestore: p.join(basePath, 'corestore'),
  }
  Object.values(paths).forEach(p => mkdirp.sync(p))

  const level = leveldb(paths.level, 'level')
  const store = cstore(paths.corestore, null, { level })

  return store
}
