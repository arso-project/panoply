const Sonar = require('@archipel/sonar')
const { Readable } = require('stream')
const debug = require('debug')('sonarview')

module.exports = sonarView

class IndexManager {
  constructor (db, catalog) {
    this.catalog = catalog
    this.db = db
    this.info = {}
    this.indexes = {}
    this._init = false
  }

  async ready () {
    if (this._init) return
    try {
      this.info = JSON.parse(await this.db.get('indexes'))
    } catch (e) {
      this.info = {}
    }

    for (let name of Object.keys(this.info)) {
      this.indexes[name] = await this.catalog.open(name)
    }

    await this.make('textdump')

    this._init = true
  }

  async make (name, schema) {
    if (this.indexes[name]) return
    let indexSchema
    if (name === 'textdump') indexSchema = getTextdumpSchema()
    else indexSchema = makeSonarSchema(schema)

    this.info[name] = indexSchema
    this.indexes[name] = await this.catalog.openOrCreate(name, indexSchema)

    await this.db.put('indexes', JSON.stringify(this.info))
  }

  getSchema (name) {
    if (!this.indexes[name]) throw new Error('Index does not exist: ' + name)
    return this.info[name]
  }

  get (name) {
    if (!this.indexes[name]) throw new Error('Index does not exist: ' + name)
    return this.indexes[name]
  }
}

function sonarView (db, cstore, opts) {
  const catalog = new Sonar(opts.storage || '.tantivy')
  const manager = new IndexManager(db, catalog)
  const schemas = {}

  // const getIndex = catalog.openOrCreate('default', sonarSchema)

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
    await manager.ready()
    const index = manager.get('textdump')
    const hstart = process.hrtime.bigint()
    const results = await index.query(string)
    const hend = process.hrtime.bigint()
    debug(`Query ${string} took ${(parseInt(hend - hstart) / 1000000)}ms`)
    return results
  }

  async function _map (msgs) {
    await manager.ready()

    const docs = {}

    for (let msg of msgs) {
      console.log('map', msg)
      try {
        let { schema: schemaName, id, value, source } = msg

        let body = objectToString(value)
        // for (let [name, def] of Object.entries(schema.properties)) {
        //   if (def.type === 'string') {
        //     body = body + ' ' + value[name]
        //   }
        // }

        docs.textdump = docs.textdump || []
        docs.textdump.push({ body, id, source })

        const schema = await loadSchema(schemaName)

        if (!schema) continue

        await manager.make(schemaName, schema)

        let indexSchema = manager.getSchema(schemaName)
        let fields = indexSchema.map(f => f.name)

        const doc = Object.entries(value).reduce((acc, [key, value]) => {
          if (fields.indexOf(key) !== -1) acc[key] = value
          return acc
        }, {})

        docs[schemaName] = docs[schemaName] || []
        docs[schemaName].push(doc)
      } catch (e) {
        // TODO: What's the right way to handle errors at this level?
        console.error('ERROR', e)
      }
    }

    for (let [schemaName, currentDocs] of Object.entries(docs)) {
      let index = manager.get(schemaName)
      try {
        console.log('push to', schemaName, currentDocs)
        await index.addDocuments(currentDocs)
      } catch (e) {
        console.log('sonar error', e)
      }
    }
  }

  function loadSchema (name) {
    if (!schemas[name]) {
      schemas[name] = new Promise((resolve, reject) => {
        cstore.getSchema(name, (err, schema) => {
          // if (err) reject(err)
          if (schema) resolve(schema)
          else resolve(null)
        })
      })
    }
    return schemas[name]
  }
}

function getTextdumpSchema () {
  const schema = [
    {
      name: 'body',
      type: 'text',
      options: {
        indexing: {
          record: 'position',
          tokenizer: 'en_stem'
        },
        stored: true
      }
    },
    ...commonFields()
  ]
  return schema
}

function makeSonarSchema (schema) {
  let tschema = []
  for (let [name, prop] of Object.entries(schema.properties)) {
    if (prop.type === 'string') {
      tschema.push({
        name: name,
        type: 'text',
        options: {
          indexing: {
            record: 'position',
            tokenizer: 'en_stem'
          },
          stored: true
        }
      })
    }
    if (prop.type === 'date') {
      tschema.push({
        name: name,
        type: 'date',
        options: {
          indexed: true,
          fast: 'multi',
          stored: true
        }
      })
    }
  }

  return [...tschema, ...commonFields()]
}

function commonFields () {
  return [
    {
      name: 'id',
      type: 'text',
      options: {
        indexing: {
          record: 'basic',
          tokenizer: 'default'
        },
        stored: true
      }
    },
    {
      name: 'source',
      type: 'text',
      options: {
        indexing: {
          record: 'basic',
          tokenizer: 'default'
        },
        stored: true
      }
    }
  ]
}

function objectToString (obj) {
  if (typeof obj === 'string' || typeof obj === 'number') {
    return obj
  } else if (Array.isArray(obj)) {
    return obj.map(objectToString).join(' ')
  } else if (!obj) {
    return ''
  } else if (typeof obj === 'object') {
    return Object.values(obj).map(objectToString).join(' ')
  }
  return ''
}
