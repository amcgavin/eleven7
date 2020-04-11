import * as React from 'react'
import * as ReactDOM from 'react-dom'
import axios from 'axios'
import 'semantic-ui-css/semantic.min.css'
import App from './App'

const Main = () => {
  return <App />
}
axios.defaults.headers.common['X-CSRFToken'] = csrftoken

ReactDOM.render(<Main />, document.getElementById('root'))
