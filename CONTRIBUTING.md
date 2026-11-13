# Contributing

Thanks for helping. This project is deliberately small and deliberately boring, so
the bar is about *restraint* as much as features.

## Non-negotiables

These are the reason people trust the extension. A PR that breaks one will be closed
regardless of how useful it is.

1. **No telemetry, analytics, ads, or affiliate links.** Ever.
2. **No network destination other than `https://chatgpt.com`.**
3. **No new permissions** without opening an issue first. `storage` and
   `chatgpt.com` host access are the entire budget.
4. **No remote code**, no `eval`, no `new Function`, no CDN imports, no
   `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`.
5. **No bulk delete endpoint.** One request per conversation the user ticked.
6. **No persisted tokens, conversation IDs, or titles.** Counts and settings only.
7. **No build step for the extension itself.** `src/` is what ships. Readable,
   unminified, no bundler, no framework.

`npm run guard` enforces 2, 4, and 6 mechanically. CI runs it on every PR.

## Getting started

```bash
npm ci
npm run build     # build/firefox, build/chrome, dist/*.zip
npm test          # check + guard + e2e + layout
```

The e2e suite starts a self-signed fake `chatgpt.com` on `127.0.0.1:8443`, maps the
hostname in Chrome, loads the real extension, and asserts on every request it made.
It never touches a real account.

Branded Chrome 137+ ignores `--load-extension`, so point `CHROME_PATH` at Chromium or
Chrome for Testing:

```bash
npx @puppeteer/browsers install chrome@stable
CHROME_PATH=<printed path> npm test
```

## Code style

- Plain ES2020 JavaScript, no dependencies, no TypeScript.
- Two-space indent, single quotes, semicolons. Long lines are fine if they stay
  readable.
- Keep `src/api.js` as the only file that calls `fetch`.
- User-controlled strings (conversation titles) must go through `textContent`,
  never `innerHTML`.
- Every new UI control needs a label and keyboard access.

## Tests

Please add a check to `tests/e2e.mjs` for behaviour changes. The suite asserts:

- only ticked conversation IDs receive `DELETE`
- the number of `DELETE` requests equals the number selected
- dry run sends zero `DELETE`
- the confirmation button stays disabled until the count is typed
- no unexpected endpoints are contacted
- the server total drops by exactly the number deleted

Layout regressions go in `tests/layout.mjs`.

## Commits and PRs

- One logical change per PR. Small is good.
- Describe the user-visible effect and how you tested it.
- Note any change to permissions, storage keys, or network calls explicitly — those
  get extra scrutiny.
- Update `CHANGELOG.md` for user-visible changes.

## Reporting bugs

Use the issue template. Include the exact status line from the panel (it contains no
personal data), browser and version, and whether it happened while listing or while
deleting. **Never paste tokens, cookies, or screenshots containing your chats.**
