import test from 'node:test';
import assert from 'node:assert/strict';
import { createHotelGame, takeHotelAction, endShift } from '../game-core.js';

test('a new shift opens with three guests, four actions, and a working hotel', () => {
  const game = createHotelGame({ seed: 11 });

  assert.equal(game.day, 1);
  assert.equal(game.actionsLeft, 4);
  assert.equal(game.status, 'playing');
  assert.equal(game.guests.length, 3);
  assert.ok(game.reputation > 0);
  assert.ok(game.mayhem < 100);
});

test('fulfilling a guest need spends one action and earns a reputation boost', () => {
  const game = createHotelGame({ seed: 11 });
  const guest = game.guests[0];
  const next = takeHotelAction(game, { type: 'fulfill', guestId: guest.id });

  assert.equal(next.actionsLeft, 3);
  assert.equal(next.guests[0].satisfied, true);
  assert.ok(next.cash > game.cash);
  assert.ok(next.reputation > game.reputation);
  assert.ok(next.mayhem < game.mayhem);
});

test('ending a shift makes ignored guests angry and opens a new shift', () => {
  const game = createHotelGame({ seed: 7 });
  const next = endShift(game);

  assert.equal(next.day, 2);
  assert.equal(next.actionsLeft, 4);
  assert.ok(next.mayhem > game.mayhem);
  assert.ok(next.reputation < game.reputation);
  assert.equal(next.status, 'playing');
});

test('five perfectly managed shifts earn a hotel legend victory', () => {
  let game = createHotelGame({ seed: 3 });
  for (let day = 0; day < 5; day += 1) {
    for (const guest of game.guests) game = takeHotelAction(game, { type: 'fulfill', guestId: guest.id });
    game = endShift(game);
  }

  assert.equal(game.status, 'won');
  assert.equal(game.day, 6);
});

test('repairing the hotel trades cash and an action for lower mayhem', () => {
  const game = createHotelGame({ seed: 4 });
  const next = takeHotelAction(game, { type: 'repair' });

  assert.equal(next.actionsLeft, 3);
  assert.equal(next.cash, game.cash - 25);
  assert.ok(next.mayhem < game.mayhem);
});
