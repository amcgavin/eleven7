import * as React from 'react'
import axios from 'axios'
import { Button, Form, Grid, Header } from 'semantic-ui-react'

const makeFormHandler = url => {
  const [formState, dispatch] = React.useReducer(
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
          return state
      }
    },
    { values: {}, errors: {}, submittedValues: {} },
  )
  const changeHandler = React.useCallback(e => {
    dispatch({ type: 'set', key: e.target.name, value: e.target.value })
  }, [])

  React.useEffect(() => {
    if (!Object.keys(formState.submittedValues).length) return
    axios
      .post(url, formState.submittedValues)
      .then(() => {
        // todo: something with the response
      })
      .catch(error => {
        if (error.response.status === 400) {
          dispatch({ type: 'set-error', errors: error.response.data.errors })
        }
      })
      .then(() => {
        dispatch({ type: 'finish-submit' })
      })
  }, [formState.submittedValues, url])

  const onSubmit = React.useCallback(e => {
    e.preventDefault()
    dispatch({ type: 'submit' })
  }, [])
  return [
    changeHandler,
    onSubmit,
    formState.values,
    formState.errors,
    !!Object.keys(formState.submittedValues).length,
  ]
}

const LoginPage = () => {
  const [changeHandler, onSubmit, values, errors, submitting] = makeFormHandler('/api/login/')
  return (
    <Grid textAlign="center" style={{ height: '100vh' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="teal" textAlign="center" />
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
