const routes = [
  {
    path: '/',
    exact: true,
    component: require('./pages/index.jsx')
  },
  {
    path: '/id/:id',
    exact: true,
    component: require('./pages/id.jsx')
  }
]

module.exports = routes
