const fs = require('fs')
const p = require('path')
const browserify = require('browserify')
const documentify = require('documentify')
const hyperstream = require('hstream')
const mkdirp = require('mkdirp')

const BUILD_PATH = p.join('.', 'build')

mkdirp.sync(BUILD_PATH)

const entry = p.join(__dirname, 'frontend', 'index.js')
const indexHtml = p.join(__dirname, 'frontend', 'index.html')

const outfileJs = p.join(BUILD_PATH, 'bundle.js')
const outfileCss = p.join(BUILD_PATH, 'bundle.css')
const outfileHtml = p.join(BUILD_PATH, 'index.html')

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
    outfile: outfileJs /* this option is required if using API mode */
  })
}

build()
docify()

function build () {
  b.bundle()
    .on('error', e => console.error(String(e)))
    .on('end', () => console.log('build finished'))
    .pipe(fs.createWriteStream(outfileJs))
}

function docify () {
  const d = documentify(false, fs.createReadStream(indexHtml))
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
  rs.pipe(fs.createWriteStream(outfileHtml))
}

function addToHead (str) {
  return hyperstream({
    head: {
      _appendHtml: str
    }
  })
}
