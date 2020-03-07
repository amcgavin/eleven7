import * as React from 'react'
import { Button, Form, Header } from 'semantic-ui-react'
import { makeFormHandler } from 'src/State/forms'

const LoginPage = () => {
  const [changeHandler, onSubmit, values, errors, submitting] = makeFormHandler(
    '/api/login/',
    'login-form',
  )
  return (
    <React.Fragment>
      <Header as="h2" color="teal" textAlign="center" />
      <Form error onSubmit={onSubmit} loading={submitting} size="large">
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
    </React.Fragment>
  )
}

export default LoginPage
