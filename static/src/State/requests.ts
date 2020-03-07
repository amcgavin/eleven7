import * as React from 'react'
import axios, { AxiosRequestConfig } from 'axios'
import { useDispatch } from 'react-redux'
import useLocalSelector from './useLocalSelector'

interface RequestState {
  [requestId: string]: boolean
}

interface RequestAction {
  type: string
  requestId: string
}

const random = () => Math.random().toString(16)

type SubmitCallback = (config: AxiosRequestConfig) => void

export const useRequest = (
  actionType: string,
  actionProps?: any,
  cacheKey?: string,
): [boolean, SubmitCallback] => {
  const dispatch = useDispatch()
  const [uniqueId, nextId] = React.useReducer(random, null, random)
  const requestId = cacheKey || uniqueId
  const loading = useLocalSelector('requests', state => state[requestId])
  const submit = React.useCallback<SubmitCallback>(
    config => {
      if (loading !== undefined) return
      dispatch({ type: 'requests-start', requestId })
      axios
        .request(config)
        .then(response => {
          dispatch({ type: actionType, status: 'success', response, actionProps })
        })
        .catch(error => {
          dispatch({ type: actionType, status: 'error', response: error.response, actionProps })
        })
        .then(() => {
          dispatch({ type: 'requests-end', requestId })
          nextId()
        })
    },
    [actionType, requestId, actionProps],
  )
  return [!!loading, submit]
}

export const reducer = (state: RequestState = {}, action: RequestAction) => {
  switch (action.type) {
    case 'requests-start':
      return { ...state, [action.requestId]: true }
    case 'requests-end':
      return { ...state, [action.requestId]: false }
    default:
      return state
  }
}
