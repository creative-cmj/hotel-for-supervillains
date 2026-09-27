const RADIUS = 0.35;

export function collides(x, z, obstacles, radius = RADIUS) {
  return obstacles.some((box) => x + radius > box.minX && x - radius < box.maxX && z + radius > box.minZ && z - radius < box.maxZ);
}

export function advancePlayer(player, input, delta, obstacles) {
  const dt = Math.min(0.05, Math.max(0, delta));
  const forward = Number(Boolean(input.forward)) - Number(Boolean(input.back));
  const strafe = Number(Boolean(input.right)) - Number(Boolean(input.left));
  const magnitude = Math.hypot(forward, strafe) || 1;
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  const speed = input.run ? 7 : 4.4;
  const goalX = ((sin * forward + cos * strafe) / magnitude) * speed;
  const goalZ = ((-cos * forward + sin * strafe) / magnitude) * speed;
  const blend = 1 - Math.exp(-(forward || strafe ? 14 : 9) * dt);
  let vx = player.vx + (goalX - player.vx) * blend;
  let vz = player.vz + (goalZ - player.vz) * blend;
  let x = player.x;
  let z = player.z;
  if (!collides(x + vx * dt, z, obstacles)) x += vx * dt;
  else vx = 0;
  if (!collides(x, z + vz * dt, obstacles)) z += vz * dt;
  else vz = 0;
  return { ...player, x, z, vx, vz };
}
