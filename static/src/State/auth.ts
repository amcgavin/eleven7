import * as React from 'react'
import axios from 'axios'

interface LockedOffer {
  status: string
  cents_per_litre: number
  total_litres: number
  fuel_type: string
  expires_at: Date
  redeemed_at: Date
}

interface AuthState {
  firstname: string
  loggedIn: boolean
  lockedOffer?: LockedOffer
}

const state: { user: AuthState; loaded: boolean } = {
  user: { firstname: '', loggedIn: false },
  loaded: false,
}

const listeners = []

const notify = user => {
  listeners.forEach(l => l(user))
}

export const login = ({
  firstname,
  locked_offer,
}: {
  firstname: string
  locked_offer: LockedOffer
}) => {
  state.user = {
    firstname,
    lockedOffer: {
      ...locked_offer,
      expires_at: new Date(locked_offer.expires_at),
      redeemed_at: new Date(locked_offer.redeemed_at),
    },
    loggedIn: true,
  }
  notify(state.user)
}

export const logout = () => {
  state.user = { firstname: '', loggedIn: false }
  notify(state.user)
}

export const useLoggedIn = () => {
  const [user, setUser] = React.useState(state.user)
  React.useEffect(() => {
    if (!state.loaded) {
      state.loaded = true
      axios
        .get('/api/details/')
        .then(response => {
          login(response.data)
        })
        .catch(() => {
          // nothing to catch - failed login
        })
    }
    listeners.push(setUser)
    return () => {
      listeners.slice(listeners.indexOf(setUser), 1)
    }
  }, [setUser])
  return user
}
