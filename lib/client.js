const hyperquest = require('hyperquest')
const ws = require('websocket-stream')
const shortid = require('shortid')
const ndjson = require('../util/ndjson-duplex-stream')
const collect = require('collect-stream')

const RESOURCE_TYPES = {
  thumnbail: 'thumbnail',
  main: 'main',
  meta: 'meta'
}

class Client {
  constructor (baseUrl, opts = {}) {
    this.baseUrl = baseUrl
    this.log = opts.log || logger()
  }

  createReadStream (path) {
    return this.ws('hyperdrive/readFile/' + path)
  }

  createWriteStream (path) {
    return this.ws('hyperdrive/writeFile/' + path)
  }

  writeFileFromUrl (url, path, opts = {}) {
    return new Promise((resolve, reject) => {
      this.log.info('Start import file', url, path)
      const quest = hyperquest(url)
      const ws = this.createWriteStream(path)
      quest.pipe(ws)
      ws.on('close', () => resolve())
      ws.on('error', err => reject(err))
      quest.on('error', err => reject(err))

      if (opts.killTime) {
        setTimeout(() => {
          this.log.debug('Killed after timeout: ' + opts.killTime)
          quest.destroy()
          ws.destroy()
        }, opts.killTime)
      }
    })
  }

  writeFileFromBuffer (buf, path) {
    return new Promise((resolve, reject) => {
      // console.log('start write buf', path)
      const ws = this.createWriteStream(path)
      // logEvents(ws, 'writeStream')
      ws.write(buf)
      ws.end()
      ws.on('close', () => resolve())
      ws.on('error', err => reject(err))
    })
  }

  async createEntityWithFiles (files, data, opts) {
    let id = await this.createId()

    for (let file of files) {
      try {
        if (file.sourceUrl) {
          this.log.info('Import file from url:', file.sourceUrl)
          await this.writeFileFromUrl(file.sourceUrl, file.target, { killTime: opts.killTime })
          file._success = true
        } else if (file.sourceBuffer) {
          this.log.info('Import file from buffer:', file.sourceBuffer.length)
          await this.writeFileFromBuffer(file.sourceBuffer, file.target)
          file._success = true
        } else {
          file._error = 'Invalid file'
          this.log.error('Invalid file: ', file)
        }
        this.log.info('Imported file', file.target)
      } catch (err) {
        file._error = err
        this.log.error('Error fetch file: ' + file.sourceUrl, err)
      }
    }

    let errs = files.filter(f => f._error).length
    let succs = files.filter(f => f._success).length
    this.log.info(`Imported ${files.length} files.\nSuccess: ${succs} Errors: ${errs}.`)

    files = files.filter(f => f._success)

    if (!files.length) throw new Error('No file imported successfully.')

    let entityFiles = files.map(file => {
      return {
        link: '/' + file.target,
        resourceType: file.resourceType
      }
    })

    let entity = {
      schema: 'arso.xyz/Entity',
      id,
      value: {
        label: data.label,
        files: entityFiles,
        origin: data.origin
      }
    }

    await this.put(entity)
    this.log.info('Saved entity: ' + id)
    return id
  }

  ws (path, opts = {}) {
    let url = this.baseUrl + path
    let stream = ws(url, {
      perMessageDeflate: false
    })
    if (opts.ndjson) {
      stream = ndjson(stream)
    }
    return stream
  }

  put (record) {
    this.log.info('Put record: ', record)
    return new Promise((resolve, reject) => {
      // TODO: Keep batch stream open.
      const batchStream = this.ws('batch', { ndjson: true })
      batchStream.write([{
        op: 'put',
        ...record
      }])
      batchStream.on('data', ids => {
        console.log('put record done', ids)
        resolve(ids)
      })
      batchStream.on('error', err => reject(err))
    })
  }

  async createId () {
    // TODO: Receive id from server.
    return shortid.generate()
  }
}

function fetchJson (url) {
  return new Promise((resolve, reject) => {
    const quest = hyperquest(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    quest.on('error', err => reject(err))
    collect(quest, (err, buf) => {
      if (err) return reject(err)
      const json = JSON.parse(buf.toString())
      resolve(json)
    })
  })
}

module.exports = {
  RESOURCE_TYPES,
  Client,
  fetchJson,
  logger
}

function logger () {
  return {
    info: console.log,
    debug: console.log,
    error: console.error
  }
}
