export function findInteraction(player, objects, available = () => true) {
  let best = null;
  let bestScore = Infinity;
  for (const object of objects) {
    if (!available(object)) continue;
    const dx = object.position.x - player.x;
    const dz = object.position.z - player.z;
    const distance = Math.hypot(dx, dz);
    if (distance > object.radius || Math.abs(object.position.y - player.y) > 2.5) continue;
    const facing = dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw);
    if (facing < -0.5 && distance > 0.9) continue;
    const score = distance - facing * 0.3;
    if (score < bestScore) { best = object; bestScore = score; }
  }
  return best;
}
