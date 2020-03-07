import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRequest } from './requests'
import { FormActionType } from './forms'

interface AuthState {
  email: string
  balance: number
  loggedIn: boolean
}

const initialState = {
  email: '',
  balance: 0,
  loggedIn: false,
}

const REQUEST_UPDATE = 'auth-request-update'

export const useIsAuth = () => {
  const [loading, submit] = useRequest(REQUEST_UPDATE, undefined, 'auth')
  const loggedIn = useSelector(state => state.auth.loggedIn)
  React.useEffect(() => {
    submit({
      method: 'get',
      url: '/api/details/',
    })
  }, [])
  return [loading, loggedIn]
}

const parseResponse = ({ email, balance }) => ({ email, balance, loggedIn: true })

export const reducer = (state: AuthState = initialState, action) => {
  switch (action.type) {
    case FormActionType.REQUEST_UPDATE:
      if (action.actionProps === 'login-form' && action.status === 'success') {
        return parseResponse(action.response.data)
      }
      return state
    case REQUEST_UPDATE:
      if (action.status === 'success') {
        return parseResponse(action.response.data)
      }
      return state
    default:
      return state
  }
}
