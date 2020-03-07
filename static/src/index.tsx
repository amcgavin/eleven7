import * as React from 'react'
import * as ReactDOM from 'react-dom'
import axios from 'axios'
import 'semantic-ui-css/semantic.min.css'
import { Provider } from 'react-redux'

import App from './App'
import configureStore from './configureStore'

const store = configureStore()
const Main = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
axios.defaults.headers.common['X-CSRFToken'] = csrftoken

ReactDOM.render(<Main />, document.getElementById('root'))
