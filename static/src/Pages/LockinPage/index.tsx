import * as React from 'react'
import axios from 'axios'
import makeFormHandler from 'src/State/forms'
import { useLoggedIn, login } from 'src/State/auth'
import { Button, Form, Header } from 'semantic-ui-react'

interface Offer {
  type: string
  price: number
  lat: number
  lng: number
}

const LockedOffer = () => {
  const { lockedOffer } = useLoggedIn()
  if (!lockedOffer) return null
  return (
    <p>
      current lock-in is {lockedOffer.status.toLocaleLowerCase()}.
      <ul style={{ textAlign: 'left' }}>
        <li>Cents per litre: {lockedOffer.cents_per_litre}</li>
        <li>Expires at {`${lockedOffer.expires_at}`}</li>
      </ul>
    </p>
  )
}

export default () => {
  const [offers, setOffers] = React.useState<Offer[]>([])
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
    login,
  )
  const selectHandler = React.useCallback(
    (e, props) => {
      const selected = props.options.find(
        (option: { offer: Offer; value: string }) => option.value === props.value,
      )
      if (selected) {
        changeHandler({ name: 'fuel_type', value: selected.offer.type })
        changeHandler({ name: 'expected_price', value: selected.offer.price })
        changeHandler({ name: 'lat', value: selected.offer.lat })
        changeHandler({ name: 'lng', value: selected.offer.lng })
      }
    },
    [changeHandler],
  )
  return (
    <React.Fragment>
      <Header as="h2" color="teal" textAlign="center">
        Lock in
      </Header>
      <LockedOffer />
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
