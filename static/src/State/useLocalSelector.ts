import { useSelector } from 'react-redux'
import { ApplicationState } from '../rootReducer'

const useLocalSelector = <TSelected = unknown>(
  key: string,
  selector: (state: ApplicationState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean,
): TSelected => useSelector<ApplicationState, TSelected>(state => selector(state[key]), equalityFn)

export default useLocalSelector
