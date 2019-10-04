const fs = require('fs')
const p = require('path')
const browserify = require('browserify')
const mkdirp = require('mkdirp')
const minimist = require('minimist')
const mirror = require('mirror-folder')

const html = require('./html.js')

const argv = minimist(process.argv.slice(2), {
  default: {
    server: true
  },
  alias: {
    w: 'watch'
  }
})
console.log(argv)

const BUILD_PATH = p.join(__dirname, 'dist')

const BUILD_PATHS = {
  browser: p.join(BUILD_PATH, 'browser'),
  ssr: p.join(BUILD_PATH, 'ssr')
}

for (let path of Object.values(BUILD_PATHS)) {
  mkdirp.sync(path)
}

run({
  watch: argv.watch,
  dev: true
})

function run (opts) {
  const entryBrowser = p.join(__dirname, 'src/index.js')
  const browser = makeBrowserify(entryBrowser, {
    tinify: !opts.dev,
    debug: opts.dev,
    css: true
  })

  let server
  // if (opts.server) {
  //   let entryServer = p.join(__dirname, 'main-ssr.js')
  //   server = makeBrowserify(entryServer, {
  //     bare: true,
  //     node: true,
  //     bundleExternal: false,
  //     standalone: 'panoply.frontend',
  //     tinify: false
  //   })
  // }

  if (opts.watch) {
    browser.plugin(require('watchify'))
    browser.on('update', build)
    browser.plugin(require('browserify-livereload'), {
      host: 'localhost',
      port: 13337,
      outfile: p.join(BUILD_PATHS.browser, 'main.js')
    })
  }

  build()

  const mirrorer = mirror(p.join(__dirname, 'static'), BUILD_PATHS.browser, {
    keepExisting: true,
    watch: opts.watch
  })
  mirrorer.on('put', (src, dst) => {
    let from = rel(src.name)
    let to = rel(dst.name)
    console.log(`Copied: ${from} -> ${to}`)
  })

  const htmlString = html()
  fs.writeFile(
    p.join(BUILD_PATHS.browser, 'index.html'),
    htmlString,
    (err) => {
      if (err) console.error('Error writing index.html')
      else console.log('index.html written')
    }
  )

  function build () {
    let browserPath = p.join(BUILD_PATHS.browser, 'main.js')
    browser.bundle()
      .on('error', e => console.error(String(e)))
      .on('end', () => console.log(`browser build finished, written: ${rel(browserPath)}`))
      .pipe(fs.createWriteStream(browserPath))

    if (server) {
      let serverPath = p.join(BUILD_PATHS.ssr, 'main.js')
      server.bundle()
        .on('error', e => console.error(String(e)))
        .on('end', () => console.log(`server build finished, written: ${rel(serverPath)}`))
        .pipe(fs.createWriteStream(serverPath))
    }
  }
}

function makeBrowserify (entry, opts = {}) {
  const b = browserify(entry, opts)
    .transform('babelify')

  let cssPath
  if (opts.css) {
    cssPath = p.join(BUILD_PATHS.browser, 'main.css')
  }

  b.plugin('css-modulesify', {
    output: cssPath,
    before: [
      'postcss-import',
      require('postcss-nested')
    ],
    after: [
      require('autoprefixer')
    ],
    'postcss-import': {
      // Apparently, css-modulesify passes a wrong
      // absolute path to postcss for each source file.
      // This makes postcss-import not find anything.
      // Setting the path opt to node_modules at least
      // allows to directly include style sheets from
      // npm modules (though without resolving via
      // package.json main field). See also:
      // https://github.com/css-modules/css-modulesify/issues/82
      // https://github.com/css-modules/css-modulesify/issues/80
      path: [p.join(__dirname, '..', 'node_modules')]
    }
  })

  if (opts.tinify) {
    b.plugin('tinyify')
  }

  return b
}

function rel (path) {
  return p.relative(__dirname, path)
}
