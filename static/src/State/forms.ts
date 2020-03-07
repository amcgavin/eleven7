import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useRequest } from './requests'
import useLocalSelector from './useLocalSelector'

export enum FormActionType {
  SET = 'forms-set',
  REQUEST_UPDATE = 'forms-request-update',
}

interface FormAction {
  type: FormActionType
  formId: string
}

interface FormState {
  [formId: string]: {
    values: {
      [name: string]: string
    }
    errors: {
      [key: string]: string
    }
  }
}
const getForm = (formId: string) => state => state[formId] || {}
const getFormValues = form => form.values || {}
const getFormErrors = form => form.errors || {}

export const makeFormHandler = (url: string, formId) => {
  const [loading, submit] = useRequest(FormActionType.REQUEST_UPDATE, formId)
  const dispatch = useDispatch()
  const form = useLocalSelector('forms', getForm(formId))
  const values = getFormValues(form)
  const errors = getFormErrors(form)
  const changeHandler = React.useCallback(
    (_, { name, value }) => {
      dispatch({ type: FormActionType.SET, formId, name, value })
    },
    [dispatch, formId],
  )

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
      submit({
        method: 'POST',
        url,
        data,
      })
    },
    [url, formId, submit],
  )
  return [changeHandler, onSubmit, values, errors, loading]
}

export const reducer = (state: FormState = {}, action: FormAction) => {
  switch (action.type) {
    case FormActionType.SET:
      return {
        ...state,
        [action.formId]: {
          ...state[action.formId],
          values: { ...getFormValues(getForm(action.formId)(state)), [action.name]: action.value },
        },
      }
    case FormActionType.REQUEST_UPDATE:
      switch (action.status) {
        case 'success':
          return { ...state, [action.actionProps]: { values: {}, errors: {} } }
        case 'error':
          if (action.response)
            return {
              ...state,
              [action.actionProps]: {
                ...state[action.actionProps],
                errors: { ...action.response.errors },
              },
            }
          return {
            ...state,
            [action.actionProps]: {
              ...state[action.actionProps],
              errors: { __all__: ['An error occurred, please refresh the page and try again.'] },
            },
          }
        default:
          return state
      }
    default:
      return state
  }
}
