import Home from './pages/Home'
import Search from './pages/Search'
import EntityPage from './pages/EntityPage'
import Debug from './pages/Debug'
import Importer from './pages/Importer'
import Add from './pages/Add'

const routes = [
  {
    path: '/',
    exact: true,
    component: Home,
    link: {
      title: 'Home',
      weight: -10
    }
  },
  {
    path: '/search',
    exact: true,
    component: Search,
    link: {
      title: 'Search'
    }
  },
  {
    path: '/id/:id',
    exact: true,
    component: EntityPage
  },
  {
    path: '/debug',
    exact: true,
    component: Debug,
    link: {
      title: 'Debug',
      weight: 10
    }
  },
  {
    path: '/importer',
    component: Importer,
    link: {
      title: 'Import'
    }
  },
  {
    path: '/add',
    component: Add,
    link: {
      title: 'Add'
    }
  }
]

export default routes
