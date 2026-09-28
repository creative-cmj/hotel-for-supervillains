const FLOOR_IDS = Object.freeze({ 1: 0, 2: 2, 3: 3 });
const ROOM_ROWS = Object.freeze([8, 4, 0, -4, -8]);

export const GUEST_ROOMS = Object.freeze(
  [1, 2, 3].flatMap((floor) =>
    Array.from({ length: 10 }, (_, index) => floor * 100 + index + 1)
      .filter((number) => ![110, 210, 310].includes(number)),
  ),
);

function removeCollider(colliders, collider) {
  const index = colliders.indexOf(collider);
  if (index >= 0) colliders.splice(index, 1);
}

function addCollider(colliders, collider) {
  if (!colliders.includes(collider)) colliders.push(collider);
}

export function roomLocation(number) {
  const room = number % 100;
  const row = Math.floor((room - 1) / 2);
  const side = room % 2 ? 1 : -1;
  return { floor: FLOOR_IDS[Math.floor(number / 100)], side, z: ROOM_ROWS[row] };
}

export function createDoorSystem(world) {
  const doors = new Map();
  for (const number of GUEST_ROOMS) {
    const hinge = world.hotel.getObjectByName(`ROOM_${number}_DOOR_HINGE`);
    if (!hinge) throw Error(`Hotel asset missing ROOM_${number}_DOOR_HINGE`);
    const { floor, side, z } = roomLocation(number);
    const collider = {
      minX: side > 0 ? 1.72 : -2.10,
      maxX: side > 0 ? 2.10 : -1.72,
      minZ: z - 0.78,
      maxZ: z + 0.78,
      doorNumber: number,
    };
    const door = {
      number,
      floor,
      side,
      z,
      hinge,
      collider,
      state: 'closed',
      angle: 0,
      targetAngle: 0,
      object: null,
      deliveryObject: null,
    };
    hinge.rotation.y = 0;
    addCollider(world.colliders[floor], collider);
    const object = {
      id: `room-${number}`,
      action: 'guest-door',
      number,
      position: { x: side * 1.18, y: floor === 0 ? 0 : floor === 2 ? 4.5 : 9, z },
      radius: 1.75,
      minFacing: 0.05,
      prompt: `Open Room ${number}`,
      mesh: hinge,
    };
    door.object = object;
    world.objects.push(object);
    const deliveryObject = {
      id: `delivery-${number}`,
      action: 'request-delivery',
      number,
      position: { x: side * 3.05, y: floor === 0 ? 0 : floor === 2 ? 4.5 : 9, z },
      radius: 1.45,
      minFacing: -.2,
      prompt: `Complete delivery · Room ${number}`,
      mesh: hinge,
    };
    door.deliveryObject = deliveryObject;
    world.objects.push(deliveryObject);
    doors.set(number, door);
  }

  const api = {
    doors,
    get(number) { return doors.get(number); },
    setLockedPrompt(number, prompt) {
      const door = doors.get(number);
      if (door) door.object.prompt = prompt;
    },
    open(number, instant = false) {
      const door = doors.get(number);
      if (!door) return false;
      removeCollider(world.colliders[door.floor], door.collider);
      door.state = instant ? 'open' : 'opening';
      door.targetAngle = door.side > 0 ? -Math.PI / 2 : Math.PI / 2;
      if (instant) {
        door.angle = door.targetAngle;
        door.hinge.rotation.y = door.angle;
      }
      door.object.prompt = `Close Room ${number}`;
      return true;
    },
    close(number, instant = false) {
      const door = doors.get(number);
      if (!door) return false;
      door.state = instant ? 'closed' : 'closing';
      door.targetAngle = 0;
      if (instant) {
        door.angle = 0;
        door.hinge.rotation.y = 0;
        addCollider(world.colliders[door.floor], door.collider);
      }
      door.object.prompt = `Open Room ${number}`;
      return true;
    },
    toggle(number, { locked = false, lockedPrompt = `Room ${number} · Occupied` } = {}) {
      const door = doors.get(number);
      if (!door) return 'missing';
      if (locked && door.state !== 'open') {
        door.object.prompt = lockedPrompt;
        return 'locked';
      }
      if (door.state === 'closed' || door.state === 'closing') {
        api.open(number);
        return 'opening';
      }
      api.close(number);
      return 'closing';
    },
    update(delta) {
      const blend = 1 - Math.exp(-9 * Math.min(0.1, delta));
      for (const door of doors.values()) {
        door.angle += (door.targetAngle - door.angle) * blend;
        door.hinge.rotation.y = door.angle;
        if (door.state === 'opening' && Math.abs(door.targetAngle - door.angle) < 0.025) {
          door.angle = door.targetAngle;
          door.state = 'open';
        } else if (door.state === 'closing' && Math.abs(door.angle) < 0.025) {
          door.angle = 0;
          door.hinge.rotation.y = 0;
          door.state = 'closed';
          addCollider(world.colliders[door.floor], door.collider);
        }
      }
    },
  };
  return api;
}
