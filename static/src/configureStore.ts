/* eslint-disable no-underscore-dangle */
import { createStore, compose } from 'redux'
import rootReducer from './rootReducer'

const composeStore = () => {
  let composeEnhancers = compose
  // @ts-ignore
  if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    // @ts-ignore
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      trace: true,
      traceLimit: 25,
    })
  }
  return composeEnhancers()(createStore)
}

export default function configureStore() {
  return composeStore()(rootReducer, {
    forms: {},
    requests: {},
  })
}
