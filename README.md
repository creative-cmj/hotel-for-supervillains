# Hotel for Supervillains

A local browser game about managing **The Grand Disaster**, the only hotel trusted by retired supervillains.

## Play

From this folder, run:

```bash
python -m http.server 4179
```

Then visit `http://127.0.0.1:4179` in a browser.

## Rules

- Survive five shifts.
- Handle villain requests to gain cash, reputation, and lower mayhem.
- Send the repair crew when the hotel starts falling apart.
- End a shift whenever you want, but every ignored villain damages reputation and raises mayhem.
- Win with reputation above zero and mayhem below 100.

Progress is saved in this browser only.

## Verify

```bash
node --test tests/hotel-core.test.mjs
```

For the browser playthrough, start Chrome with DevTools on port 9228 and run:

```bash
node tests/browser-playthrough.mjs
```
