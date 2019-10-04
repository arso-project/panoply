module.exports = { clock, logEvents }
const util = require('util')
const log = require('../lib/log')

function clock () {
  const [ss, sn] = process.hrtime()
  return () => {
    const [ds, dn] = process.hrtime([ss, sn])
    const ns = (ds * 1e9) + dn
    const ms = round(ns / 1e6)
    const s = round(ms / 1e3)
    if (s >= 1) return s + 's'
    if (ms >= 0.01) return ms + 'ms'
    if (ns) return ns + 'ns'
  }
}

function logEvents (emitter, name) {
  let emit = emitter.emit
  emitter.emit = (...args) => {
    // const params = args.slice(1).map(arg => {
    //   util.inspect(arg, { depth: 0 })
    // })
    let params
    if (args.length === 2 && Buffer.isBuffer(args[1])) {
      if (args[1].length === 32) {
        params = `[ <BUF ${args[1].toString('hex')}> ]`
      } else {
        params = `[ <BUF (${args[1].length})> ]`
      }
    } else {
      params = util.inspect(args.slice(1), { depth: 0 })
    }
    log.debug('(%s) %s', name, args[0], params)
    emit.apply(emitter, args)
  }
}

function round (num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
