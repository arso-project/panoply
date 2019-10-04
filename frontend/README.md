# panoply frontend

A progressive web app frontend for panoply with SSR support.

* Uses React for rendering.
* Bundled with browserify.
* Support for server-side rendering through a fastify plugin.

The `build.js` build script creates two bundles: One for server-side rendering (entrypoint `main-ssr.js`) and one for the browser (entrypoint `main-router.js`). Run `node build.js` to build for production, and `node build.js -w` to build in development mode and watch for changes.

To enable server-side rendering in a fastify app, register `fastify.js` as a fastify plugin.

Routes are universal and defined in `routes.js`. They are defined in the format expected by [`react-router-config`](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config).

On the client side, routing uses `react-router-dom` with `react-router-config`. For the server, the same routes are registered in fastify through `fastify.get()`.

*TODO: Add hooks for prefetching data on the server and use a two-pass rendering scheme.*

The HTML template is exported from `html.js`.
