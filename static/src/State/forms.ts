import * as React from 'react'
import axios from 'axios'

interface ChangeEvent {
  name: string
  value: string
}
export const makeInputHandler = changeHandler => {
  return React.useCallback(
    e => {
      changeHandler({ name: e.target.name, value: e.target.value })
    },
    [changeHandler],
  )
}
const makeFormHandler = (url, submitHandler) => {
  const [formState, dispatch] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'set':
          return { ...state, values: { ...state.values, [action.key]: action.value } }
        case 'clear':
          return { values: {}, errors: {} }
        case 'submit':
          return { ...state, errors: {}, loading: true }
        case 'finish-submit':
          return { ...state, loading: false }
        case 'set-error':
          return { ...state, errors: { ...action.errors } }
        default:
          return state
      }
    },
    { values: {}, errors: {}, loading: false },
  )
  const changeHandler = React.useCallback((e: ChangeEvent) => {
    dispatch({ type: 'set', key: e.name, value: e.value })
  }, [])

  const onSubmit = React.useCallback(
    e => {
      e.preventDefault()
      const fd: string[][] = Array.from(new FormData(e.currentTarget).entries())
      const data = fd.reduce(
        (current: object, [k, v]) => ({
          ...current,
          [k]: v,
        }),
        {},
      )
      dispatch({ type: 'submit' })
      axios
        .post(url, data)
        .then(response => submitHandler(response.data))
        .catch(error => {
          if (error.response.status === 400) {
            dispatch({ type: 'set-error', errors: error.response.data.errors })
          }
        })
        .then(() => {
          dispatch({ type: 'finish-submit' })
        })
    },
    [url, submitHandler],
  )
  return [changeHandler, onSubmit, formState.values, formState.errors, formState.loading]
}
export default makeFormHandler
