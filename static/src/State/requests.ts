import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

type ResourceGetter = () => AxiosResponse

const makeResource = (config: AxiosRequestConfig): ResourceGetter => {
  let status = 'pending'
  let result: Error | AxiosResponse
  const promise = axios
    .request(config)
    .then(response => {
      result = response
      status = 'success'
    })
    .catch(error => {
      result = error
      status = 'error'
    })
  return () => {
    switch (status) {
      case 'pending':
        throw promise
      case 'success':
        return result as AxiosResponse
      case 'error':
        throw result
      default:
        throw new Error(`unknown status: ${status}`)
    }
  }
}

export default makeResource
