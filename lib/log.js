const pino = require('pino')
const argv = require('minimist')(process.argv.slice(2))

const logger = pino({
  name: 'archipel',
  level: argv['log-level'] || 'debug',
  enabled: true
}, pino.destination(1))

module.exports = logger
