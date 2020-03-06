import * as React from 'react'
import axios from 'axios'
import { Button, Form, Grid, Header } from 'semantic-ui-react'

const makeFormHandler = url => {
  const [state, dispatch] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'set':
          return { ...state, values: { ...state.values, [action.key]: action.value } }
        case 'clear':
          return { values: {}, errors: {}, submittedValues: {} }
        case 'submit':
          return { ...state, errors: {}, submittedValues: { ...state.values } }
        case 'finish-submit':
          return { ...state, submittedValues: {} }
        case 'set-error':
          return { ...state, errors: { ...action.errors } }
        default:
          break
      }
    },
    { values: {}, errors: {}, submittedValues: {} }
  )
  const changeHandler = React.useCallback(e => {
    dispatch({ type: 'set', key: e.target.name, value: e.target.value })
  }, [])

  React.useEffect(() => {
    if (!Object.keys(state.submittedValues).length) return
    axios
      .post(url, state.submittedValues)
      .then(() => {})
      .catch(error => {
        console.log(error.response.status)
        if (error.response.status === 400) {
          dispatch({ type: 'set-error', errors: error.response.data.errors })
        }
      })
      .then(() => {
        dispatch({ type: 'finish-submit' })
      })
  }, [state.submittedValues, url])

  const onSubmit = React.useCallback(e => {
    e.preventDefault()
    dispatch({ type: 'submit' })
  }, [])
  return [
    changeHandler,
    onSubmit,
    state.values,
    state.errors,
    !!Object.keys(state.submittedValues).length,
  ]
}

const LoginPage = () => {
  const [changeHandler, onSubmit, values, errors, submitting] = makeFormHandler('/api/login/')
  return (
    <Grid textAlign="center" style={{ height: '100vh' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="teal" textAlign="center"></Header>
        <Form error={!!Object.keys(errors).length} onSubmit={onSubmit} size="large">
          <Form.Input
            name="email"
            onChange={changeHandler}
            value={values.email || ''}
            error={errors.email}
            fluid
            icon="user"
            iconPosition="left"
            placeholder="E-mail address"
          />
          <Form.Input
            name="password"
            value={values.password || ''}
            error={errors.password}
            onChange={changeHandler}
            fluid
            icon="lock"
            iconPosition="left"
            placeholder="Password"
            type="password"
          />

          <Button color="teal" fluid size="large" disabled={submitting}>
            Login
          </Button>
        </Form>
      </Grid.Column>
    </Grid>
  )
}

export default LoginPage
