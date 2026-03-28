import { readBlockConfig } from '../../scripts/aem.js';

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;
    if (key === 'class') {
      node.className = value;
      return;
    }
    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        node.dataset[dataKey] = dataValue;
      });
      return;
    }
    if (key === 'aria') {
      Object.entries(value).forEach(([ariaKey, ariaValue]) => {
        node.setAttribute(`aria-${ariaKey}`, ariaValue);
      });
      return;
    }
    if (key === 'text') {
      node.textContent = value;
      return;
    }
    if (key in node) {
      node[key] = value;
      return;
    }
    node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function svgIcon(name) {
  const icons = {
    flight: '<path d="M2 12.5l20-7-6.5 6.5 2 1.5-2.5 1-2 4.5-2-3.5-3.5-2 1-2.5z"></path>',
    manage: '<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="1.6"></path><path d="M8 10h8M8 13h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
    checkin: '<path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="1.6"></path><path d="M8.2 12.1l2.1 2.1 5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>',
    swap: '<path d="M7 6l-3 3 3 3M4 9h13M17 18l3-3-3-3M20 15H7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>',
    calendar: '<path d="M6 3v3M18 3v3M4.5 7.5h15v12h-15z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 11h3M8 14h3M13 11h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
    user: '<path d="M12 13.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" fill="none" stroke="currentColor" stroke-width="1.6"></path><path d="M5 21a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
    miles: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.flight}</svg>`;
}

function iconNode(name) {
  const wrap = el('span', { class: 'flight-booking__icon', aria: { hidden: 'true' } });
  wrap.innerHTML = svgIcon(name);
  return wrap;
}

function fieldShell(labelText, inputEl, extraClass = '') {
  const label = el('label', { class: `flight-booking__field ${extraClass}`.trim() });
  label.append(
    el('span', { class: 'flight-booking__label', text: labelText }),
    el('span', { class: 'flight-booking__control' }, inputEl),
  );
  return label;
}

function textInput(value = '', placeholder = '', name = '') {
  return el('input', {
    type: 'text',
    name,
    value,
    placeholder,
    autocomplete: 'off',
    spellcheck: 'false'
  });
}

function dateInput(value = '', name = '') {
  return el('input', {
    type: 'date',
    name,
    value
  });
}

function radioOption(name, value, labelText, checked = false) {
  const inputId = `${name}-${value}`;
  const input = el('input', {
    type: 'radio',
    id: inputId,
    name,
    value,
    checked
  });
  const label = el('label', { class: 'flight-booking__radio', for: inputId }, input, el('span', { text: labelText }));
  return { input, label };
}

function createTabButton(key, label, active = false, icon = 'flight') {
  return el('button', {
    type: 'button',
    class: `flight-booking__tab${active ? ' is-active' : ''}`,
    dataset: { tab: key },
    aria: {
      selected: String(active),
      controls: `panel-${key}`
    }
  }, iconNode(icon), el('span', { text: label }));
}

function makeActionButton(label, className = 'flight-booking__cta') {
  return el('button', { type: 'submit', class: className, text: label });
}

function buildFlightPanel(cfg) {
  const roundTrip = radioOption('triptype', 'round-trip', cfg.roundtriplabel || 'Round Trip', cfg.triptype === 'round-trip');
  const oneWay = radioOption('triptype', 'one-way', cfg.onewaylabel || 'One-way', cfg.triptype === 'one-way');
  const multiCity = radioOption('triptype', 'multi-city', cfg.multicitylabel || 'Multi-City', cfg.triptype === 'multi-city');

  const tripOptions = el('div', { class: 'flight-booking__trip-types' }, roundTrip.label, oneWay.label, multiCity.label);
  const milesToggle = el('label', { class: 'flight-booking__miles-toggle' },
    el('span', { class: 'flight-booking__miles-copy' }, iconNode('miles'), el('span', { text: cfg.mileslabel || 'Pay with Alfursan Miles' })),
    el('input', { type: 'checkbox', name: 'miles', checked: toBool(cfg.showmilestoggle, true) }),
    el('span', { class: 'flight-booking__switch', 'aria-hidden': 'true' })
  );

  const origin = fieldShell(cfg.fromlabel || 'From', textInput('', cfg.fromplaceholder || 'Departure', 'from'), 'flight-booking__field--origin');
  const destination = fieldShell(cfg.tolabel || 'To', textInput('', cfg.toplaceholder || 'Destination', 'to'), 'flight-booking__field--destination');
  const departureInput = dateInput(cfg.departuredate || todayISO(0), 'departuredate');
  const returnInput = dateInput(cfg.returndate || todayISO(1), 'returndate');
  const dateControls = el('div', { class: 'flight-booking__date-controls' },
    el('div', { class: 'flight-booking__date-control' },
      el('span', { class: 'flight-booking__date-subtitle', text: cfg.departuredatelabel || 'Departure' }),
      departureInput
    ),
    el('span', { class: 'flight-booking__date-separator', text: '—' }),
    el('div', { class: 'flight-booking__date-control flight-booking__date-control--return' },
      el('span', { class: 'flight-booking__date-subtitle', text: cfg.returndatelabel || 'Return' }),
      returnInput
    )
  );
  const dateField = el('label', { class: 'flight-booking__field flight-booking__field--dates' },
    el('span', { class: 'flight-booking__label', text: cfg.datelabel || 'Date' }),
    el('span', { class: 'flight-booking__control' }, dateControls)
  );

  const swapButton = el('button', {
    type: 'button',
    class: 'flight-booking__swap',
    title: 'Swap origin and destination',
    aria: { label: 'Swap origin and destination' }
  }, iconNode('swap'));

  const passengers = fieldShell(cfg.passengerslabel || 'Passengers', textInput(cfg.passengersvalue || '1 Adult', '', 'passengers'), 'flight-booking__field--passengers');
  const promo = cfg.showpromolink === false || cfg.showpromolink === 'false'
    ? null
    : el('button', { type: 'button', class: 'flight-booking__promo', text: cfg.promolabel || '+ Add promo code' });
  const cta = makeActionButton(cfg.ctalabel || "Let's fly!");

  const form = el('form', { class: 'flight-booking__form' },
    el('div', { class: 'flight-booking__row flight-booking__row--meta' },
      el('div', { class: 'flight-booking__trip-wrapper' }, tripOptions),
      cfg.showmilestoggle === false || cfg.showmilestoggle === 'false' ? null : el('div', { class: 'flight-booking__miles-wrapper' }, milesToggle)
    ),
    el('div', { class: 'flight-booking__row flight-booking__row--routes' },
      origin,
      cfg.showswapbutton === false || cfg.showswapbutton === 'false' ? null : swapButton,
      destination,
      dateField
    ),
    el('div', { class: 'flight-booking__row flight-booking__row--footer' },
      passengers,
      promo,
      cta
    )
  );

  const helper = el('p', {
    class: 'flight-booking__helper',
    text: cfg.multicityhint || 'Add more city pairs in the live booking flow'
  });

  const panel = el('section', {
    id: 'panel-flight',
    class: 'flight-booking__panel is-active',
    dataset: { panel: 'flight' },
    role: 'tabpanel'
  }, form, helper);

  return { panel, origin, destination, departureInput, returnInput, swapButton, roundTrip: roundTrip.input, oneWay: oneWay.input, multiCity: multiCity.input, cta };
}

function buildManagePanel(cfg) {
  const reference = fieldShell(cfg.managereferencelabel || 'Booking reference', textInput('', 'PNR or booking code', 'bookingreference'));
  const lastname = fieldShell(cfg.managelastnamelabel || 'Last name', textInput('', 'Surname', 'lastname'));
  const panel = el('section', {
    id: 'panel-manage',
    class: 'flight-booking__panel',
    dataset: { panel: 'manage' },
    role: 'tabpanel',
    hidden: true
  },
    el('div', { class: 'flight-booking__panel-copy' },
      el('h3', { class: 'flight-booking__panel-title', text: cfg.manageheading || 'Manage your booking' }),
      el('p', { class: 'flight-booking__panel-text', text: cfg.managedescription || 'Retrieve or change an existing reservation.' })
    ),
    el('div', { class: 'flight-booking__manage-grid' }, reference, lastname),
    makeActionButton(cfg.managectalabel || 'Find booking', 'flight-booking__cta flight-booking__cta--wide')
  );
  return panel;
}

function buildCheckinPanel(cfg) {
  const reference = fieldShell(cfg.checkinreferencelabel || 'Booking reference', textInput('', 'PNR or booking code', 'bookingreference'));
  const lastname = fieldShell(cfg.checkinlastnamelabel || 'Last name', textInput('', 'Surname', 'lastname'));
  const panel = el('section', {
    id: 'panel-checkin',
    class: 'flight-booking__panel',
    dataset: { panel: 'checkin' },
    role: 'tabpanel',
    hidden: true
  },
    el('div', { class: 'flight-booking__panel-copy' },
      el('h3', { class: 'flight-booking__panel-title', text: cfg.checkinheading || 'Check in to your flight' }),
      el('p', { class: 'flight-booking__panel-text', text: cfg.checkindescription || 'Complete check-in and download your boarding pass.' })
    ),
    el('div', { class: 'flight-booking__manage-grid' }, reference, lastname),
    makeActionButton(cfg.checkinctalabel || 'Check in', 'flight-booking__cta flight-booking__cta--wide')
  );
  return panel;
}

function activateTab(block, tabs, panels, tabName) {
  tabs.forEach((btn) => {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === tabName;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
  block.dataset.activeTab = tabName;
}

function updateTripType(block, tripType, returnInput, helper) {
  block.dataset.tripType = tripType;
  const isOneWay = tripType === 'one-way';
  const isMultiCity = tripType === 'multi-city';
  returnInput.closest('.flight-booking__date-control--return')?.classList.toggle('is-hidden', isOneWay);
  helper.classList.toggle('is-visible', isMultiCity);
}

export default function decorate(block) {
  const cfg = readBlockConfig(block);
  const activeTab = cfg.activetab || 'flight';
  const tripType = cfg.triptype || 'round-trip';

  block.textContent = '';
  block.classList.add('flight-booking');
  block.dataset.activeTab = activeTab;
  block.dataset.tripType = tripType;

  const topTabs = el('div', { class: 'flight-booking__tabs', role: 'tablist', 'aria-label': 'Flight booking tabs' });
  const tabs = [];
  const panels = [];

  const flightTab = createTabButton('flight', cfg.flighttablabel || 'Flight', activeTab === 'flight', 'flight');
  const manageTab = toBool(cfg.showmanage, true) ? createTabButton('manage', cfg.managetablabel || 'Manage', activeTab === 'manage', 'manage') : null;
  const checkinTab = toBool(cfg.showcheckin, true) ? createTabButton('checkin', cfg.checkintablabel || 'Check-in', activeTab === 'checkin', 'checkin') : null;

  [flightTab, manageTab, checkinTab].forEach((tab) => {
    if (!tab) return;
    tabs.push(tab);
    topTabs.append(tab);
  });

  const flight = buildFlightPanel(cfg);
  const manage = buildManagePanel(cfg);
  const checkin = buildCheckinPanel(cfg);
  panels.push(flight.panel, manage, checkin);

  block.append(topTabs, flight.panel, manage, checkin);

  const onSwap = () => {
    const fromValue = flight.origin.querySelector('input').value;
    const toValue = flight.destination.querySelector('input').value;
    flight.origin.querySelector('input').value = toValue;
    flight.destination.querySelector('input').value = fromValue;
  };

  flight.swapButton?.addEventListener('click', onSwap);

  const tripInputs = block.querySelectorAll('input[type="radio"][name="triptype"]');
  const helper = flight.panel.querySelector('.flight-booking__helper');
  tripInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      updateTripType(block, event.target.value, flight.returnInput, helper);
    });
  });

  updateTripType(block, tripType, flight.returnInput, helper);
  activateTab(block, tabs, panels, activeTab);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activateTab(block, tabs, panels, tab.dataset.tab);
    });
  });

  block.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      block.dispatchEvent(new CustomEvent('flight-booking:submit', {
        bubbles: true,
        detail: {
          tab: block.dataset.activeTab,
          tripType: block.dataset.tripType,
          payload
        }
      }));
    });
  });
}
