const L = require('lodash')

// TODO: This cannot live here of course.
const mappings = [
  {
    from: 'tacker-date',
    to: 'arso.xyz/Event',
    map (msg, done) {
      const value = msg.value
      const targetValue = {
        date: L.get(value, 'field_date[0].value'),
        title: L.get(value, 'title[0].value'),
        body: L.get(value, 'body[0].value'),
        created: L.get(value, 'created[0].value'),
        link: L.get(value, 'field_link[0].uri'),
        meta: {
          sourceId: L.get(value, 'nid[0].value'),
          sourceUrl: 'https://tacker.fr/node/' + L.get(value, 'nid[0].value')
        }
      }
      done(null, targetValue)
    }
  },
]

module.exports = mappings
