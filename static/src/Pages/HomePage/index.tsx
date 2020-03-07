import * as React from 'react'
import axios from 'axios'
import { makeFormHandler } from 'src/State/forms'
import { Button, Form, Header } from 'semantic-ui-react'

export default () => {
  const [offers, setOffers] = React.useState([])
  React.useEffect(() => {
    axios.get('/api/prices/').then(response => {
      setOffers(response.data.prices)
    })
  }, [])
  const formattedOffers = React.useMemo(
    () =>
      offers.map(offer => ({
        text: `${offer.type} at ${offer.price}`,
        value: offer.type,
        offer,
      })),
    [offers],
  )
  const [changeHandler, onSubmit, values, errors, submitting] = makeFormHandler(
    '/api/lockin/',
    'lockin-form',
  )
  const selectHandler = React.useCallback(
    (e, props) => {
      const selected = props.options.find(offer => offer.value === props.value)
      if (selected) {
        changeHandler(e, props)
        changeHandler(e, { name: 'expected_price', value: selected.offer.price })
        changeHandler(e, { name: 'lat', value: selected.offer.lat })
        changeHandler(e, { name: 'lng', value: selected.offer.lng })
      }
    },
    [changeHandler],
  )
  return (
    <React.Fragment>
      <Header as="h2" color="teal" textAlign="center" />
      <Form error loading={submitting} onSubmit={onSubmit} size="large">
        <Form.Select
          options={formattedOffers}
          name="fuel_type"
          onChange={selectHandler}
          value={values.fuel_type || ''}
          error={errors.fuel_type}
          fluid
        />
        <input type="hidden" name="fuel_type" value={values.fuel_type || ''} />
        <input type="hidden" name="expected_price" value={values.expected_price || ''} />
        <input type="hidden" name="lat" value={values.lat || ''} />
        <input type="hidden" name="lng" value={values.lng || ''} />
        <Button color="teal" fluid size="large" disabled={submitting}>
          Lock In
        </Button>
      </Form>
    </React.Fragment>
  )
}
