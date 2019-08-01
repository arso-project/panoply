const Sonar = require('@archipel/sonar')
const sonarSchema = require('@archipel/sonar/node/fixtures').schema
const { Readable } = require('stream')

module.exports = sonarView

function sonarView (db, cstore, opts) {
  const catalog = new Sonar(opts.storage || '.tantivy')

  const getIndex = catalog.openOrCreate('default', sonarSchema)

  return {
    batch: true,
    map (msgs, next) {
      _map(msgs)
        .then(res => next(null, res))
        .catch(err => next(err))
    },
    api: {
      // TODO: Make really streaming.
      query (kcore, args, cb) {
        const string = args.query
        const stream = new Readable({
          objectMode: true,
          read () {}
        })
        _query(string)
          .then(response => {
            const { results } = response
            results.forEach(result => {
              stream.push(result)
            })
          })
          .catch(err => console.error(err))
        return stream
      }
    }
  }

  async function _query (string) {
    const index = await getIndex
    const results = await index.query(string)
    return results
  }

  async function _map (msgs) {
    const index = await getIndex
    const docs = []
    msgs.forEach(msg => {
      let { schema, id, value } = msg
      schema = schema.split('/')[1]
      const doc = { id }

      doc.title = value.title || ''
      doc.body = JSON.stringify(value)

      if (doc.body || doc.title) {
        docs.push(doc)
      }
    })
    try {
      await index.addDocuments(docs)
    } catch (e) {
      console.log('sonar error', e)
    }
  }
}
