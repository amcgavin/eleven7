import * as React from 'react'
import { useSelector } from 'react-redux'
import { useRequest } from './requests'
import { FormActionType } from './forms'

interface LockedOffer {
  status: string
  cents_per_litre: number
  total_litres: number
  fuel_type: string
  expires_at: Date
  redeemed_at: Date
}

interface AuthState {
  email: string
  loggedIn: boolean
  lockedOffer?: LockedOffer
}

const initialState = {
  email: '',
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

const parseResponse = ({
  firstname,
  locked_offer,
}: {
  firstname: string
  locked_offer: LockedOffer
}) => ({
  firstname,
  lockedOffer: {
    ...locked_offer,
    expires_at: new Date(locked_offer.expires_at),
    redeemed_at: new Date(locked_offer.redeemed_at),
  },
  loggedIn: true,
})

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
