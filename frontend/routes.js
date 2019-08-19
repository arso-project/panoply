const routes = [
  {
    path: '/',
    exact: true,
    component: require('./pages/home.jsx')
  },
  {
    path: '/search',
    exact: true,
    component: require('./pages/search.jsx')
  },
  {
    path: '/id/:id',
    exact: true,
    component: require('./pages/id.jsx')
  },
  {
    path: '/debug',
    exact: true,
    component: require('./pages/debug.jsx')
  },
  {
    path: '/importer',
    component: require('./pages/importer.jsx'),
    ssr: false
  }

]

module.exports = routes
