import { combineReducers } from 'redux'

import { reducer as forms } from './State/forms'
import { reducer as requests } from './State/requests'
import { reducer as auth } from './State/auth'

export interface ApplicationState {
  [reducer: string]: {}
}

export default combineReducers({ forms, requests, auth })
