import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'

const useStyles = makeStyles(theme => ({
  wrapper: {
    padding: theme.spacing(2),
    display: 'flex'
  },
  button: {
    margin: theme.spacing(1)
  },
  input: {
    display: 'none'
  }
}))

export function MaterialTest () {
  const classes = useStyles()

  return (
    <div>
      <Paper className={classes.wrapper}>
        <Button
          variant='contained'
          color='primary'
          className={classes.button}
          margin='normal'
        >
       Save
        </Button>
        <TextField
          id='filled-name'
          label='Name'
          margin='normal'
        />
        <FormControl margin='normal' className={classes.formControl}>
          <InputLabel htmlFor='filled-age-simple'>
         Age
          </InputLabel>
          <Select
            value={10}
            onChange={e => console.log('change', e)}
            inputProps={{
              name: 'age',
              id: 'filled-age-simple'
            }}
          >
            <MenuItem value=''>
              <em>None</em>
            </MenuItem>
            <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </div>
  )
}
