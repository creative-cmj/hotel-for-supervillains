export const REQUEST_CATALOG = Object.freeze([
  {
    id: 'voltage-regulator',
    guest: 'Voltessa',
    room: 205,
    floor: 2,
    item: 'Voltage Regulator',
    request: 'The bedside outlets are only producing regular electricity. Embarrassing.',
    reward: 180,
    reputation: 2,
  },
  {
    id: 'botanical-filter',
    guest: 'The Bloom Queen',
    room: 303,
    floor: 3,
    item: 'Containment Filter',
    request: 'My begonias have developed ambitions. Bring the containment filter.',
    reward: 220,
    reputation: 3,
  },
]);

export function canOfferRequest(state, now = Date.now()) {
  return state.step === 'complete' && !state.request && now >= (state.nextRequestAt || 0);
}

export function acceptNextRequest(state) {
  if (!canOfferRequest(state)) return state;
  const index = (state.requestIndex || 0) % REQUEST_CATALOG.length;
  const definition = REQUEST_CATALOG[index];
  return {
    ...state,
    request: { id: definition.id, stage: 'pickup', room: definition.room, floor: definition.floor },
  };
}

export function pickupRequestItem(state) {
  if (!state.request || state.request.stage !== 'pickup' || state.carried) return state;
  return { ...state, carried: 'service-parcel', request: { ...state.request, stage: 'delivery' } };
}

export function dropRequestItem(state) {
  if (state.carried !== 'service-parcel' || !state.request) return state;
  return { ...state, carried: null, request: { ...state.request, stage: 'pickup' } };
}

export function completeRequest(state, room, now = Date.now()) {
  if (!state.request || state.request.stage !== 'delivery' || state.request.room !== room || state.carried !== 'service-parcel') return state;
  const definition = REQUEST_CATALOG.find((entry) => entry.id === state.request.id);
  if (!definition) return state;
  return {
    ...state,
    carried: null,
    request: null,
    requestIndex: (state.requestIndex || 0) + 1,
    nextRequestAt: now + 30000,
    cash: state.cash + definition.reward,
    reputation: Math.min(100, state.reputation + definition.reputation),
  };
}

export function activeRequestDefinition(state) {
  return state.request ? REQUEST_CATALOG.find((entry) => entry.id === state.request.id) || null : null;
}

export function requestObjective(state) {
  const definition = activeRequestDefinition(state);
  if (!definition) return null;
  if (state.request.stage === 'pickup') return { title: `Collect ${definition.item}`, hint: 'Guest service parcel · Storage' };
  return { title: `Deliver ${definition.item}`, hint: `${definition.guest} · Room ${definition.room} · Floor ${definition.floor}` };
}
