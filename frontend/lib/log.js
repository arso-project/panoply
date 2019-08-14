module.exports = function (name) {
  return {
    info: (...args) => console.log(`[${name}]`, ...args),
    error: (...args) => console.log(`[${name}] ERROR`, ...args),
    debug: (...args) => console.log(`[${name}]`, ...args)
  }
}
