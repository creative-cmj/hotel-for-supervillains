export function initialMission() {
  return { step: 'phone', cash: 4850, reputation: 72, mayhem: 12, carried: null, floor: 0, roomOpen: false, hasUsedComputer: false, request: null, requestIndex: 0, nextRequestAt: 0 };
}

export function transition(state, event) {
  if (event === 'answer-phone' && state.step === 'phone') return { ...state, step: 'battery' };
  if (event === 'pick-battery' && state.step === 'battery' && !state.carried) return { ...state, step: 'elevator', carried: 'battery' };
  if (event === 'drop-battery' && state.carried && state.step !== 'complete') return { ...state, carried: null, step: 'battery' };
  if (event === 'arrive-floor3' && state.step === 'elevator' && state.carried === 'battery') return { ...state, floor: 3, step: 'deliver' };
  if (event === 'arrive-lobby' && state.floor === 3) return { ...state, floor: 0 };
  if (event === 'open-room' && state.floor === 3 && state.step === 'deliver' && state.carried === 'battery') return { ...state, roomOpen: true };
  if (event === 'deliver' && state.step === 'deliver' && state.carried === 'battery' && state.floor === 3 && state.roomOpen) {
    return { ...state, step: 'computer', carried: null, cash: state.cash + 300, reputation: Math.min(100, state.reputation + 5), mayhem: Math.max(0, state.mayhem - 4) };
  }
  if (event === 'use-computer' && state.step === 'computer' && state.floor === 0) return { ...state, hasUsedComputer: true };
  if (event === 'exit-computer' && state.hasUsedComputer) return { ...state, step: 'complete' };
  return state;
}
