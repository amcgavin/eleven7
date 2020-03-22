import * as React from 'react'
import makeResource from './requests'

const current = { resource: null }

export default () => {}
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
