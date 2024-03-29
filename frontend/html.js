const DOMAIN = process.env.PANOPLY_DOMAIN || ''

module.exports = function (opts) {
  opts = {
    main: '',
    head: [],
    footer: [],
    prefix: '',
    domain: DOMAIN,
    ...opts || {}
  }

  const link = link => [opts.domain, opts.prefix, link]
    .join('')

  const head = [
    `<link rel="stylesheet" href="${link('/dist/main.css')}">`,
    `<link rel="stylesheet" href="${link('/dist/fonts/iAQuattro/ia-quattro.css')}">`,
    ...opts.head
  ].join('')

  const footer = [
    `<script src="${link('/dist/main.js')}" defer></script>`,
    ...opts.footer
  ].join('')

  const main = opts.main || ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>panoply</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta id="theme-color" name="theme-color" content="#f0c">
    <!-- <link rel="manifest" href="${link('/dist/manifest.json')}"> -->
    <!-- <link rel="shortcut icon" href="${link('/dist/favicon.png')}" sizes="144x144" type="image/png"> -->
    ${head}
  </head>
  <body>
    <div id="root">${main}</div>
    <script>
      window.__archipel = ${JSON.stringify(opts)}
    </script>
    ${footer}
  </body>
</html>
`
}
