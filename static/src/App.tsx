import * as React from 'react'
import { BrowserRouter, Switch } from 'react-router-dom'
import { Grid } from 'semantic-ui-react'
import LoginPage from './Pages/LoginPage'
import HomePage from './Pages/LockinPage'
import { AuthenticatedRoute, UnauthenticatedRoute } from './Routing'

export default () => {
  return (
    <Grid textAlign="center" style={{ height: '100vh' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <BrowserRouter>
          <Switch>
            <UnauthenticatedRoute path="/login/" exact component={LoginPage} />
            <AuthenticatedRoute path="/" exact component={HomePage} />
          </Switch>
        </BrowserRouter>
      </Grid.Column>
    </Grid>
  )
}
