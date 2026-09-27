import { createHotelGame, takeHotelAction, endShift } from './game-core.js';

const STORAGE_KEY = 'hotel-for-supervillains-v1';
const app = document.querySelector('#app');
let game = loadGame();
let showIntro = !game;
game ??= createHotelGame({ seed: Date.now() });

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.status === 'playing' ? saved : null;
  } catch {
    return null;
  }
}

function saveGame() {
  if (game.status === 'playing') localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  else localStorage.removeItem(STORAGE_KEY);
}

function pct(value) { return `${Math.max(0, Math.min(100, value))}%`; }
function hearts(guest) { return '●'.repeat(guest.patience) + '○'.repeat(Math.max(0, 4 - guest.patience)); }

function guestCard(guest, index) {
  const state = guest.satisfied ? 'satisfied' : 'waiting';
  const status = guest.satisfied ? 'Handled — disaster postponed' : `Needs: ${guest.need}`;
  return `
    <article class="guest-card ${state}" style="--guest:${guest.color}" aria-label="${guest.name}">
      <div class="guest-topline"><span class="room">ROOM ${301 + index}</span><span class="mood">${guest.satisfied ? '✓ SAFE' : '⚠ WAITING'}</span></div>
      <div class="guest-avatar"><span>${guest.icon}</span></div>
      <p class="guest-type">${guest.title}</p>
      <h2>${guest.name}</h2>
      <div class="patience" aria-label="Patience ${guest.patience} of 4">${hearts(guest)}</div>
      <p class="need">${status}</p>
      <button class="primary guest-action" data-action="fulfill" data-guest="${guest.id}" ${guest.satisfied || game.status !== 'playing' ? 'disabled' : ''}>
        ${guest.satisfied ? 'Crisis handled' : 'Handle request'}
      </button>
    </article>`;
}

function render() {
  const satisfied = game.guests.filter((guest) => guest.satisfied).length;
  const mayhemClass = game.mayhem > 70 ? 'danger' : game.mayhem > 45 ? 'warning' : '';
  const repClass = game.reputation < 35 ? 'danger' : '';
  app.innerHTML = `
    <section class="game-shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="Hotel for Supervillains home"><span class="brand-mark">H</span><span>HOTEL <em>for</em> SUPERVILLAINS</span></a>
        <div class="day-badge"><span>SHIFT</span><b>${Math.min(game.day, game.maxDays)} / ${game.maxDays}</b></div>
        <button class="quiet-button" data-action="new-game">New hotel</button>
      </header>

      <section class="headline">
        <div>
          <p class="eyebrow">THE GRAND DISASTER · EST. 1987</p>
          <h1>Keep the villains cozy.<br><span>Keep the city intact.</span></h1>
          <p class="subtitle">Fulfill three impossible requests each shift, repair the damage, and survive five nights of terrible hospitality.</p>
        </div>
        <div class="actions-card">
          <span>MANAGER ACTIONS</span>
          <strong>${game.actionsLeft}</strong><small>left this shift</small>
          <div class="action-dots">${[0,1,2,3].map((dot) => `<i class="${dot < game.actionsLeft ? 'filled' : ''}"></i>`).join('')}</div>
        </div>
      </section>

      <section class="stats-grid" aria-label="Hotel status">
        <div class="stat ${repClass}"><div><span>REPUTATION</span><b>${game.reputation}<small>/100</small></b></div><div class="meter"><i style="width:${pct(game.reputation)}"></i></div></div>
        <div class="stat ${mayhemClass}"><div><span>MAYHEM METER</span><b>${game.mayhem}<small>/100</small></b></div><div class="meter"><i style="width:${pct(game.mayhem)}"></i></div></div>
        <div class="stat cash"><div><span>HOTEL CASH</span><b>$${game.cash}</b></div><p>Pay for repairs. Collect service fees.</p></div>
      </section>

      <div class="section-label"><span>TONIGHT'S GUESTS</span><b>${satisfied}/3 situations contained</b></div>
      <section class="guest-grid">${game.guests.map(guestCard).join('')}</section>

      <section class="operations">
        <div class="operations-copy"><span>EMERGENCY OPERATIONS</span><h2>Room 404 has a small portal leak.</h2><p>Spend $25 to lower mayhem by 15 before it starts charging rent.</p></div>
        <button class="repair-button" data-action="repair" ${game.actionsLeft < 1 || game.cash < 25 || game.status !== 'playing' ? 'disabled' : ''}><span>⚙</span> Send repair crew <b>−$25</b></button>
        <button class="end-button" data-action="end" ${game.status !== 'playing' ? 'disabled' : ''}>End shift <span>→</span></button>
      </section>

      <section class="activity"><div class="section-label"><span>FRONT DESK LOG</span><b>Latest reports</b></div><div class="log-list">${game.log.slice(0,4).map((entry) => `<p class="log ${entry.kind}"><i></i>${entry.text}</p>`).join('')}</div></section>
    </section>
    ${showIntro ? introOverlay() : ''}
    ${game.status !== 'playing' ? endOverlay() : ''}
  `;
}

function introOverlay() {
  return `<div class="overlay intro-overlay"><div class="intro-card">
    <div class="key">PRIVATE INVITATION</div><div class="hotel-seal">H</div>
    <h2>Welcome to<br><em>The Grand Disaster.</em></h2>
    <p>You are the newest manager of the only hotel trusted by retired supervillains. Make it through five shifts with reputation above zero and mayhem below 100.</p>
    <ul><li><b>Handle requests</b> to earn cash and calm guests.</li><li><b>Repair the hotel</b> when mayhem gets dangerous.</li><li><b>End the shift</b> whenever you choose—but ignored villains leave destructive reviews.</li></ul>
    <button class="start-button" data-action="start">Open the hotel <span>→</span></button>
  </div></div>`;
}

function endOverlay() {
  const won = game.status === 'won';
  return `<div class="overlay"><div class="end-card ${won ? 'won' : 'lost'}">
    <div class="key">${won ? 'FIVE SHIFTS COMPLETE' : 'SAFETY BOARD NOTICE'}</div>
    <div class="end-icon">${won ? '★' : '☠'}</div>
    <h2>${won ? 'Hotel Legend' : 'Hotel Closed'}</h2>
    <p>${won ? `You ended with ${game.reputation} reputation, $${game.cash}, and only ${game.mayhem} mayhem. The Grand Disaster is now the most feared five-star hotel in the city.` : `Mayhem reached ${game.mayhem}/100 or reputation dropped to ${game.reputation}/100. Your guests are checking out through the walls.`}</p>
    <button class="start-button" data-action="new-game">Run a new hotel <span>↻</span></button>
  </div></div>`;
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const { action, guest } = button.dataset;
  if (action === 'start') showIntro = false;
  if (action === 'new-game') { game = createHotelGame({ seed: Date.now() }); showIntro = true; }
  if (action === 'fulfill') game = takeHotelAction(game, { type: 'fulfill', guestId: guest });
  if (action === 'repair') game = takeHotelAction(game, { type: 'repair' });
  if (action === 'end') game = endShift(game);
  saveGame();
  render();
});

render();
