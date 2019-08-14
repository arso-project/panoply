
// class FetchError extends CustomError {
//   constructor () {
//   }
// }

const log = require('../lib/log')
const { Client, fetchJson } = require('../lib/client')

async function importMotw (opts = {}) {
  const baseUrl = opts.baseUrl || 'http://localhost:9191/'
  const client = new Client(baseUrl)

  let json = await fetchJson('http://books.memoryoftheworld.org/books/')

  json = json._items
  if (!Array.isArray(json)) throw new Error('Invalid data')

  let results = []
  for (let row of json) {
    try {
      let id = await importRow(client, row, opts)
      results.push({ row, id })
    } catch (err) {
      results.push({
        row,
        error: err
      })
    }
  }

  console.log('Imported: ' + results.filter(f => f.id).length)
  console.log('Errors: ' + results.filter(f => f.error).length)
  console.log('')
  console.log(results.filter(f => f.error).map(f => f.error))
}

async function importRow (client, row, opts) {
  let pathPrefix = 'motw'
  let libraryUrl = 'https:' + row.library_url
  let libraryPrefix = row.library_url.replace(/\//g, '')
  let files = []
  if (row.cover_url) {
    files.push({
      sourceUrl: libraryUrl + row.cover_url,
      target: [pathPrefix, libraryPrefix, row.cover_url].join('/'),
      resourceType: 'thumbnail'
    })
  }
  if (row.formats) {
    for (let format of row.formats) {
      let filePath = format.dir_path + format.file_name
      files.push({
        sourceUrl: libraryUrl + filePath,
        target: [pathPrefix, libraryPrefix, filePath].join('/'),
        resourceType: 'main'
      })
    }
  }

  files.push({
    sourceBuffer: Buffer.from(JSON.stringify(row)),
    target: [pathPrefix, libraryPrefix, '_meta', row._id + '.json'].join('/'),
    resourceType: 'meta'
  })

  const id = await client.createEntityWithFiles(files, {
    label: row.title,
    origin: {
      type: 'motw-importer',
      originalId: row._id
    }
  }, { killTime: opts.killTime })

  return id
}

async function run () {
  const opts = {
    killTime: 1000
  }
  try {
    importMotw(opts)
  } catch (e) {
    console.error('Exception', e)
  }
}
run()
