import React from 'react'

import Wrapper from '../components/Wrapper.js'
import { GroupedList } from '../components/List.js'
import { useQuery } from '../hooks/records.js'

export default function Page (props) {
  return (
    <Wrapper {...props}>
      <AllEntities />
    </Wrapper>
  )
}

function AllEntities () {
  const results = useQuery('entities.all')
  return <GroupedList list={results} />
}
