import test from 'node:test';
import assert from 'node:assert/strict';
import { advancePlayer, collides } from '../systems/player.js';
import { initialMission, transition } from '../systems/mission.js';
import { findInteraction } from '../systems/interaction.js';

test('interaction prompt requires same floor, proximity, and forward facing', () => {
  const targets = [{ id: 'phone', position: {x: 2, y: 0, z: -2}, radius: 2, prompt: 'Answer Phone' }];
  assert.equal(findInteraction({x: 2,z: 0,y:0,yaw:0},targets)?.id,'phone');
  assert.equal(findInteraction({x: 2,z: 0,yaw:Math.PI},targets),null);
  assert.equal(findInteraction({x: 2,z: 0,y:9,yaw:0},targets),null);
});

test('grounded third-person movement accelerates and stops at a wall', () => {
  const walls = [{ minX: 2, maxX: 3, minZ: -2, maxZ: 2 }];
  let player = { x: 0, z: 0, vx: 0, vz: 0, yaw: 0 };
  player = advancePlayer(player, { forward: true }, 0.1, walls);
  assert.ok(player.z < 0);
  assert.ok(Math.hypot(player.vx, player.vz) > 0);
  for (let i = 0; i < 30; i += 1) player = advancePlayer(player, { right: true, run: true }, 0.08, walls);
  assert.ok(player.x < 1.7, `wall passed at x=${player.x}`);
  assert.equal(collides(2, 0, walls), true);
});

test('mission starts in the lobby with a ringing phone and no request', () => {
  const mission = initialMission();
  assert.equal(mission.step, 'phone');
  assert.equal(mission.cash, 4850);
  assert.equal(mission.carried, null);
});

test('mission rejects delivery without battery and advances only through physical steps', () => {
  const mission = initialMission();
  assert.equal(transition(mission, 'deliver'), mission);
  const called = transition(mission, 'answer-phone');
  assert.equal(called.step, 'battery');
  const holding = transition(called, 'pick-battery');
  assert.equal(holding.carried, 'battery');
  assert.equal(transition(holding, 'deliver'), holding);
  const riding = transition(holding, 'arrive-floor3');
  assert.equal(transition(riding, 'deliver'), riding);
  const delivered = transition(transition(riding, 'open-room'), 'deliver');
  assert.equal(delivered.step, 'computer');
  assert.equal(delivered.cash, 5150);
  assert.equal(delivered.reputation, 77);
  assert.equal(delivered.mayhem, 8);
  assert.equal(transition(delivered, 'exit-computer'), delivered);
  const back = transition(delivered, 'arrive-lobby');
  assert.equal(transition(transition(back, 'use-computer'), 'exit-computer').step, 'complete');
});
