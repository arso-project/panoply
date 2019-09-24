const shortid = require('shortid')

exports.generate = function generate () {
  return shortid.generate()
}
