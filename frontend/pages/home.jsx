const React = require('react')
const { useMemo, useEffect, useState, useCallback, useRef } = require('react')
const { useQuery, useCall } = require('../lib/records.js')
const Wrapper = require('../components/wrapper.jsx')

const { GroupedList } = require('../components/list.jsx')

const cn = require('classnames')

const styles = require('./home.css')

module.exports = Page

function Page (props) {
  return (
    <Wrapper {...props}>
      <AllEntities />
    </Wrapper>
  )
}

function AllEntities () {
  const results = useQuery('entities.all')
  // useEffect(() => {
  //   // if (results.length === 0) console.time('entities')
  //   // if (results.length >= 1000) console.timeEnd('entities')
  // }, [results.length])
  return <GroupedList list={results} />
}
