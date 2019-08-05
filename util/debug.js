module.exports = { clock }

function clock () {
  const [ss, sn] = process.hrtime()
  return () => {
    const [ds, dn] = process.hrtime([ss, sn])
    let ns = (ds * 1e9) + dn
    let ms = Math.round(ns / 1e6, 2)
    let s = ms / 1000
    if (s > 1) return s + 's'
    if (ms) return ms + 'ms'
    if (ns) return ns + 'ns'
  }
}
