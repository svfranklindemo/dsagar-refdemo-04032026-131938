# Flight booking EDS block

A Universal Editor-ready Edge Delivery Services block that recreates the flyadeal-style booking shell with:

- a three-tab header for Flight, Manage, and Check-in
- round-trip, one-way, and multi-city trip selectors
- swap origin/destination behavior
- date inputs, passenger summary, and promo code affordance
- separate Manage and Check-in panels with editable labels

## Files

- `_flight-booking.json` — Universal Editor block definition and model
- `flight-booking.js` — block behavior and tab switching
- `flight-booking.css` — visual styling

## Notes

- The block is designed to be edited in Universal Editor using the `flight-booking` model.
- Configurable labels and defaults are driven by the model fields.
- The block emits a `flight-booking:submit` custom event with the current tab and form payload when a form is submitted.
- Date inputs fall back to today / tomorrow when no default values are provided.
