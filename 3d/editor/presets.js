export const PRESETS = Object.freeze({
  standardA: {
    label: 'Standard Room A',
    objects: [
      ['floor', 0, 0, 0, [2,1,1.5]], ['wall', 0, -3, 0, [2,1,1]], ['wall', -4, 0, 90, [1.5,1,1]], ['wall', 4, 0, 90, [1.5,1,1]],
      ['doorframe', 0, 3, 0], ['bed', 1.8, -1.3, 0], ['nightstand', .35, -1.4, 0], ['lamp', .35, -1.35, 0],
      ['desk', -2.5, -1.8, 0], ['chair', -2.5, -.75, 180], ['plant', -3.1, 2.2, 0],
    ],
  },
  standardB: {
    label: 'Standard Room B',
    objects: [
      ['floor', 0, 0, 0, [2,1,1.5]], ['wall', 0, -3, 0, [2,1,1]], ['wall', -4, 0, 90, [1.5,1,1]], ['wall', 4, 0, 90, [1.5,1,1]],
      ['doorframe', 0, 3, 0], ['bed', 2.2, -1.25, 0], ['sofa', -2.25, -.75, 90], ['table', -.8, .2, 0],
      ['nightstand', .65, -1.4, 0], ['lamp', .65, -1.35, 0], ['sign', -2.2, -2.82, 0],
    ],
  },
  vip: {
    label: 'VIP Room',
    objects: [
      ['floor', 0, 0, 0, [2.5,1,2]], ['wall', 0, -4, 0, [2.5,1,1]], ['wall', -5, 0, 90, [2,1,1]], ['wall', 5, 0, 90, [2,1,1]],
      ['doorframe', 0, 4, 0], ['bed', 2.6, -1.8, 0, [1.2,1,1.2]], ['sofa', -2.7, -1.5, 90], ['table', -1.1, -.4, 0],
      ['console', 2.8, 1.5, 180], ['emitter', 0, 1.5, 0], ['plant', -4, 2.8, 0], ['plant', 4, 2.8, 0],
    ],
  },
  lobby: {
    label: 'Lobby Seating',
    objects: [
      ['floor', 0, 0, 0, [2.5,1,2]], ['sofa', -2, 0, 90], ['sofa', 2, 0, -90], ['table', 0, 0, 0],
      ['plant', -3.6, -2.6, 0], ['plant', 3.6, 2.6, 0], ['luggage', 0, 3, 0], ['sign', 0, -3.8, 0],
    ],
  },
  hallway: {
    label: 'Guest Hallway Module',
    objects: [
      ['floor', 0, 0, 0, [2,1,2]], ['ceiling', 0, 0, 0, [2,1,2]],
      ['wall', -4, -2.7, 90, [1.3,1,1]], ['wall', -4, 2.7, 90, [1.3,1,1]],
      ['wall', 4, -2.7, 90, [1.3,1,1]], ['wall', 4, 2.7, 90, [1.3,1,1]],
      ['doorframe', -4, 0, 90], ['doorframe', 4, 0, -90],
      ['sign', -3.82, 1.7, 90], ['sign', 3.82, 1.7, -90],
      ['plant', -3.1, -3.1, 0], ['plant', 3.1, 3.1, 0],
    ],
  },
  showcase: {
    label: 'New Props Showcase',
    objects: [
      ['floor', 0, 0, 0, [3,1,2.5]],
      ['wall', 0, 4.75, 0, [3,1,1]],
      ['suitcase', -4.5, -3, 0], ['wardrobe', -2.6, -3, 0], ['minibar', -.6, -3, 0],
      ['roomService', 1.5, -3, 0], ['housekeeping', 4, -3, 0],
      ['velvetRope', -4, 0, 0], ['securityCamera', -3.5, 4.58, 0], ['roomPlaque', 0, 4.58, 0],
      ['weatherMachine', 2.5, 0, 0], ['portalMirror', 4.7, .3, 0],
      ['chandelier', -2, 2, 0], ['wallSconce', 3.5, 4.58, 0],
    ],
  },
});
