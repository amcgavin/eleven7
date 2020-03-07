import * as React from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'
import { useIsAuth } from 'src/State/auth'

export const AuthenticatedRoute = (props: RouteProps) => {
  const { component: Component, ...rest } = props
  const [loading, isLoggedIn] = useIsAuth()
  const renderComponent = React.useCallback(() => {
    if (loading) {
      return null
    }
    if (isLoggedIn) return <Component />
    return <Redirect to="/login/" />
  }, [loading, isLoggedIn])
  return <Route {...rest} render={renderComponent} />
}

export const UnauthenticatedRoute = (props: RouteProps) => {
  const { component: Component, ...rest } = props
  const [loading, isLoggedIn] = useIsAuth()
  const renderComponent = React.useCallback(() => {
    if (loading) {
      return null
    }
    if (!isLoggedIn) return <Component />
    return <Redirect to="/" />
  }, [loading, isLoggedIn])
  return <Route {...rest} render={renderComponent} />
}
