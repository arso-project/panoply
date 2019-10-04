const React = require('react')
const { useState } = require('react')
const cn = require('classnames')

const styles = require('./cards.css')

exports.Cards = function Cards (props) {
  const [card, setCard] = useState(null)
  const { children } = props
  return (
    <div className={styles.wrap}>
      <div className={styles.cards}>
        {children.map((child, i) => {
          let cls = cn({ [styles.active]: i === card })
          return (
            <div className={cls} onClick={e => setCard(i)} key={i}>
              {child}
            </div>
          )
        })}
      </div>
      {card !== null && (
        <div className={styles.main}>
          {children[card]}
        </div>
      )}
    </div>
  )
}
