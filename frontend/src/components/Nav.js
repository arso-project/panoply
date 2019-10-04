import React, { useRef } from 'react'
import { Link } from './Link.js'
import routes from '../routes.js'

import styles from './wrapper.css'

export function Nav (props) {
  // console.log('routes', routes)
  let links = routes.filter(r => r.link)
  links = routes
    .filter(r => r.link)
    .sort((a, b) => {
      let wa = a.link.weight || 0
      let wb = b.link.weight || 0
      if (wa === wb) return cmp(a.link.title, b.link.title)
      else return cmp(wa, wb)
    })

  return (
    <nav className={styles.nav}>
      {links.map((r, i) => (
        <Link key={i} to={r.path}>{r.link.title}</Link>
      ))}
    </nav>
  )
}

function cmp (a, b) {
  return a === b ? 0 : (a > b ? 1 : -1)
}
