const guestDeck = [
  { id: 'doctor-doomscroll', name: 'Dr. Doomscroll', title: 'Mad Scientist', color: 'violet', need: 'Fresh batteries for the weather machine', icon: '⚡' },
  { id: 'count-crashula', name: 'Count Crashula', title: 'Tech Vampire', color: 'red', need: 'A room with absolutely no Wi-Fi', icon: '🦇' },
  { id: 'madame-meteor', name: 'Madame Meteor', title: 'Cosmic Menace', color: 'gold', need: 'Her forbidden breakfast asteroid', icon: '☄️' },
  { id: 'captain-complaint', name: 'Captain Complaint', title: 'Retired Sea Tyrant', color: 'cyan', need: 'A larger bathtub for the kraken', icon: '🐙' },
  { id: 'baron-bounce', name: 'Baron Bounce', title: 'Elastic Mastermind', color: 'lime', need: 'A ceiling trampoline inspection', icon: '🟢' },
  { id: 'lady-laser', name: 'Lady Laser', title: 'Disco Supervillain', color: 'pink', need: 'A mirror that cannot reflect lasers', icon: '🔺' },
];

function shuffledDeck(seed) {
  const copy = [...guestDeck];
  let state = Math.abs(Number(seed) || 1) || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createHotelGame({ seed = Date.now() } = {}) {
  const deck = shuffledDeck(seed);
  return {
    seed,
    day: 1,
    maxDays: 5,
    actionsLeft: 4,
    cash: 180,
    reputation: 72,
    mayhem: 24,
    status: 'playing',
    guests: deck.slice(0, 3).map((guest, index) => ({ ...guest, patience: 3 - index, satisfied: false })),
    futureGuests: deck.slice(3),
    log: [{ kind: 'arrival', text: 'Shift 1 begins. Keep the supervillains happy and the hotel standing.' }],
  };
}

export function takeHotelAction(game, action) {
  if (game.status !== 'playing' || game.actionsLeft <= 0) return game;

  if (action?.type === 'repair') {
    if (game.cash < 25) return game;
    return {
      ...game,
      actionsLeft: game.actionsLeft - 1,
      cash: game.cash - 25,
      mayhem: Math.max(0, game.mayhem - 15),
      log: [{ kind: 'repair', text: 'The repair crew sealed a portal leak in Room 404.' }, ...game.log].slice(0, 8),
    };
  }

  if (action?.type !== 'fulfill') return game;
  const guestIndex = game.guests.findIndex((guest) => guest.id === action.guestId);
  if (guestIndex < 0 || game.guests[guestIndex].satisfied) return game;

  const guests = game.guests.map((guest, index) => index === guestIndex ? { ...guest, satisfied: true, patience: Math.min(4, guest.patience + 1) } : guest);
  const guest = guests[guestIndex];
  return {
    ...game,
    actionsLeft: game.actionsLeft - 1,
    cash: game.cash + 35,
    reputation: Math.min(100, game.reputation + 7),
    mayhem: Math.max(0, game.mayhem - 8),
    guests,
    log: [{ kind: 'success', text: `${guest.name} is delighted. Catastrophe delayed.` }, ...game.log].slice(0, 8),
  };
}

export function endShift(game) {
  if (game.status !== 'playing') return game;
  const ignored = game.guests.filter((guest) => !guest.satisfied);
  const mayhemHit = ignored.length * 12;
  const reputationHit = ignored.length * 5;
  const day = game.day + 1;
  const mayhem = Math.min(100, game.mayhem + mayhemHit);
  const reputation = Math.max(0, game.reputation - reputationHit);
  const status = mayhem >= 100 || reputation <= 0 ? 'lost' : day > game.maxDays ? 'won' : 'playing';
  const deck = [...game.futureGuests, ...game.guests.map(({ satisfied, patience, ...guest }) => guest)];
  const guests = deck.slice(0, 3).map((guest, index) => ({ ...guest, patience: 3 - index, satisfied: false }));
  const angryText = ignored.length ? `${ignored.length} guest${ignored.length === 1 ? '' : 's'} left a very destructive review.` : 'A suspiciously peaceful shift ends.';

  return {
    ...game,
    day,
    actionsLeft: status === 'playing' ? 4 : 0,
    mayhem,
    reputation,
    status,
    guests: status === 'playing' ? guests : game.guests,
    futureGuests: deck.slice(3),
    log: [{ kind: status, text: status === 'won' ? 'The hotel survives five ridiculous shifts. You are a legendary manager.' : status === 'lost' ? 'The hotel is shut down by the Supervillain Safety Board.' : angryText }, ...game.log].slice(0, 8),
  };
}
