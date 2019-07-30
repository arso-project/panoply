const fs = require('fs')
const browserify = require('browserify')
const documentify = require('documentify')
const hyperstream = require('hstream')

const entry = './frontend/index.js'
const outfile = './build/bundle.js'
const outfileCss = './build/bundle.css'

const mode = process.argv[2] === 'watch' ? 'watch' : 'build'
const isDev = mode === 'watch'

const b = browserify(entry, { debug: isDev })
  .transform('babelify')
  .transform('sheetify', { transform: [ 'sheetify-postcss' ], basedir: __dirname })
  .plugin('css-extract', { out: () => fs.createWriteStream(outfileCss), sourceMaps: true })

if (!isDev) {
  b.plugin('tinyify')
}

if (mode === 'watch') {
  b.plugin(require('watchify'))
  b.on('update', build)
  b.plugin(require('browserify-livereload'), {
    host: 'localhost',
    port: 13337,
    outfile: outfile /* this option is required if using API mode */
  })
}

build()
docify()

function build () {
  b.bundle()
    .on('error', e => console.error(String(e)))
    .on('end', () => console.log('build finished'))
    .pipe(fs.createWriteStream(outfile))
}

function docify () {
  const d = documentify(false, fs.createReadStream('./frontend/index.html'))
  const scriptLink = '/bundle.js'
  const styleLink = '/bundle.css'
  const header = [
    `<script src="${scriptLink}" defer></script>`,
    `<link rel="stylesheet" href="${styleLink}">`
  ]
  d.transform(addToHead, header.join(''))
  d.on('error', e => console.error(e))
  let rs = d.bundle()
  rs.on('error', e => console.error(e))
  rs.pipe(fs.createWriteStream('./build/index.html'))
}

function addToHead (str) {
  return hyperstream({
    head: {
      _appendHtml: str
    }
  })
}
