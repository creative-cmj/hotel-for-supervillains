export function findInteraction(player, objects, available = () => true) {
  let best = null;
  let bestScore = Infinity;
  for (const object of objects) {
    if (!available(object)) continue;
    const dx = object.position.x - player.x;
    const dz = object.position.z - player.z;
    const distance = Math.hypot(dx, dz);
    if (distance > object.radius || Math.abs(object.position.y - player.y) > 2.5) continue;
    const facing = distance > .001 ? (dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw)) / distance : 1;
    const minimumFacing = object.minFacing ?? -.15;
    if (facing < minimumFacing && distance > .65) continue;
    const score = distance - facing * .85 + (object.priority ?? 0);
    if (score < bestScore) { best = object; bestScore = score; }
  }
  return best;
}
