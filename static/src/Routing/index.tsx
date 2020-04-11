import * as React from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'
import { useLoggedIn } from 'src/State/auth'

export const AuthenticatedRoute = (props: RouteProps) => {
  const { component: Component, ...rest } = props
  const { loggedIn } = useLoggedIn()
  const renderComponent = React.useCallback(() => {
    if (loggedIn) return <Component />
    return <Redirect to="/login/" />
  }, [loggedIn])
  return <Route {...rest} render={renderComponent} />
}

export const UnauthenticatedRoute = (props: RouteProps) => {
  const { component: Component, ...rest } = props
  const { loggedIn } = useLoggedIn()
  const renderComponent = React.useCallback(() => {
    if (!loggedIn) return <Component />
    return <Redirect to="/" />
  }, [loggedIn])
  return <Route {...rest} render={renderComponent} />
}
