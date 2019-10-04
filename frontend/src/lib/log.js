let last = time()

const levels = ['info', 'debug', 'error']

export default function log (name) {
  return levels.reduce((result, level) => {
    result[level] = _log.bind(_log, level)
    return result
  }, {})

  function _log (level, ...args) {
    const logfn = level === 'error' ? console.error : console.log

    const current = time()
    const diff = current - last
    last = current

    // const formattedTime = prettyDuration(diff)
    const formattedTime = Math.round(diff, 2) + 'ms'

    let msg = ''
    if (typeof args[0] === 'string') msg = args.shift()

    logfn(`[${name}] ${msg} (${formattedTime})`, ...args)
  }
}

function time () {
  return window.performance.now()
}

function prettyDuration (ms) {
  if (ms > 1000) {
    const s = Math.pow(1000, 2)
    return Math.round(ms / s, 2) + 's'
  } else {
    return Math.round(ms, 2) + 'ms'
  }
}
