module.exports = mapView

function mapView (db, cstore, opts) {
  const { mappings: allMappings } = opts

  const byFrom = allMappings.reduce((acc, row) => {
    acc[row.from] = acc[row.from] || []
    acc[row.from].push(row)
    return acc
  }, {})
  // console.log(byFrom)

  return {
    map
  }

  async function map (msgs, next) {
    for (let msg of msgs) {
      const { schema, id, value } = msg
      // TODO: This is no way to handle it.
      const [ns, schemaName] = schema.split('/')

      // console.log('map record', schemaName, id)
      if (!byFrom[schemaName]) continue
      // console.log('go!')

      const mappings = byFrom[schemaName]
      for (let mapping of mappings) {
        await mapRecord(msg, mapping)
      }
    }
    next()
  }

  async function mapRecord (from, mapping) {
    const value = await new Promise((resolve, reject) => {
      mapping.map(from, (err, result) => err ? reject(err) : resolve(result))
    })

    const record = {
      schema: mapping.to,
      id: from.id,
      value,
      meta: {
        origin: {
          schema: from.schema,
          seq: from.seq,
          source: from.source
          // link: `dat://${from.source}/.data/${from.schema}/${from.id}.json@${from.seq}`
        }
      }
    }

    const id = await pify(cb => cstore.put(record, cb))

    console.log('created mapping', [from.schema, mapping.to], [from.id, id])
  }
}

function pify (fn) {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}
