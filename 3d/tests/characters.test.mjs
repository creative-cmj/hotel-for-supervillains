import test from 'node:test';
import assert from 'node:assert/strict';
import { VILLAIN_ROSTER } from '../characters/villain-roster.js';
import { createVillainCharacter, inspectVillainCharacter } from '../characters/villain-builder.js';
import { NORMAL_GUEST_HEIGHT, VILLAIN_PRODUCTION_SPECS } from '../characters/villain-production-specs.js';
import { VILLAIN_PLACEMENTS } from '../world/population.js';
import { REQUEST_CATALOG } from '../systems/requests.js';

test('villain roster contains 30 fully described original guests', () => {
  assert.equal(VILLAIN_ROSTER.length, 30);
  assert.equal(new Set(VILLAIN_ROSTER.map((villain) => villain.id)).size, 30);
  assert.equal(new Set(VILLAIN_ROSTER.map((villain) => villain.name)).size, 30);
  for (const villain of VILLAIN_ROSTER) {
    for (const field of ['name','power','personality','bodyType','expression','outfit','signatureProp','item','room','roomTheme','request','archetype','headShape','handStyle']) assert.ok(villain[field], `${villain.id} needs ${field}`);
    assert.equal(villain.colors.length, 3, `${villain.id} needs a three-color identity`);
    assert.ok(villain.accessories.length >= 2, `${villain.id} needs silhouette accessories`);
    assert.match(villain.request, /[.!?]$/, `${villain.id} needs a finished hotel-request line`);
  }
  const visualSignatures = VILLAIN_ROSTER.map((villain) => [villain.archetype,villain.headShape,villain.expression,villain.accessories[0],villain.handStyle].join('|'));
  assert.equal(new Set(visualSignatures).size, 30, 'no two villains may share the same complete visual signature');
});

test('all 30 individual prompt specifications drive production geometry', () => {
  assert.equal(Object.keys(VILLAIN_PRODUCTION_SPECS).length,30);
  assert.deepEqual(Object.keys(VILLAIN_PRODUCTION_SPECS),VILLAIN_ROSTER.map((villain)=>villain.id));
  for(const villain of VILLAIN_ROSTER){const spec=VILLAIN_PRODUCTION_SPECS[villain.id];assert.ok(spec.scale>=.75&&spec.scale<=1.27,`${villain.name} has invalid prompt scale`);assert.ok(spec.headRatio>=.125&&spec.headRatio<=.33,`${villain.name} has invalid head ratio`);assert.ok(spec.signature,`${villain.name} needs its prompt signature prop`);}
});

for (let batch = 0; batch < 6; batch++) {
  test(`villain batch ${batch * 5 + 1}–${batch * 5 + 5} has complete connected game-ready bodies`, () => {
    const reports = VILLAIN_ROSTER.slice(batch*5,batch*5+5).map((villain) => {
      const character = createVillainCharacter(villain);
      const report = inspectVillainCharacter(character);
      assert.deepEqual(report.missing, [], `${villain.name} has missing body parts`);
      assert.deepEqual(report.jointGaps, [], `${villain.name} has disconnected body joints`);
      assert.ok(report.minY > -.2, `${villain.name} extends too far below its origin`);
      assert.ok(report.maxY < 4, `${villain.name} has unreasonable scale`);
      assert.ok(Math.abs(report.maxY-NORMAL_GUEST_HEIGHT*VILLAIN_PRODUCTION_SPECS[villain.id].scale)<.02,`${villain.name} must match its prompt height`);
      assert.equal(report.intentionalFloatCount,VILLAIN_PRODUCTION_SPECS[villain.id].intentionalFloatCount,`${villain.name} has an incorrect intentional floating-object count`);
      assert.ok(report.triangles > 300 && report.triangles < 10000, `${villain.name} needs visible but efficient geometry`);
      assert.ok(report.meshes >= 18, `${villain.name} needs a finished body, face, hands, and accessories`);
      for (const hand of ['HAND_L','HAND_R']) assert.ok(character.getObjectByName(hand).children.length > 0, `${villain.name} needs intentional ${hand}`);
      return report;
    });
    assert.ok(new Set(reports.map((report) => report.dimensions.map((value) => value.toFixed(1)).join('x'))).size >= 4, `batch ${batch+1} needs strong silhouette variety`);
  });
}

test('all roster guests are placed and can generate repeatable hotel work', () => {
  assert.equal(VILLAIN_PLACEMENTS.length, 29, 'Doctor Drizzle uses the existing mission model');
  assert.equal(new Set(VILLAIN_PLACEMENTS.map((entry) => entry.id)).size, 29);
  for (const placement of VILLAIN_PLACEMENTS) {
    assert.equal(placement.room, VILLAIN_ROSTER.find((entry) => entry.id === placement.id).room, `${placement.name} room metadata and placement must agree`);
  }
  assert.equal(REQUEST_CATALOG.length, 31, 'two established requests plus 29 new guest requests');
  const requests = new Map(REQUEST_CATALOG.map((entry) => [entry.guest, entry]));
  for (const villain of VILLAIN_ROSTER.filter((entry) => entry.id !== 'doctor-drizzle')) {
    const request = requests.get(villain.name);
    assert.ok(request, `${villain.name} needs a request`);
    assert.equal(request.room, villain.room);
    assert.equal(request.floor, Math.floor(villain.room / 100));
    assert.equal(request.item, villain.item);
  }
});
