# Security policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting:
**Security** tab → **Report a vulnerability**
(<https://github.com/Aashutosh31/bulk-delete-for-chatgpt/security/advisories/new>).

Do **not** open a public issue for a security problem, and never paste an access
token, session cookie, or `Authorization` header into an issue, PR, or screenshot.
If you already exposed one, log out of all ChatGPT sessions immediately.

Expect an initial response within a few days. This is a single-maintainer project,
so please be patient.

## Threat model

**Assets:** your ChatGPT session and your conversation history.

**What the extension is trusted to do:** read your conversation list, and delete the
conversations you explicitly select.

**What it must never do:** contact any host other than `chatgpt.com`, persist your
token, modify conversations you did not select, load remote code, or add telemetry.

### In scope

- Any code path that could delete a conversation the user did not select.
- Any network request to a host other than `chatgpt.com`.
- Token or cookie values being written to storage, logs, or exported files.
- Ways a hostile conversation title could execute script in the panel (XSS).
- Privilege escalation through the extension's content script.

### Out of scope

- OpenAI's own service, its rate limits, and any consequences of automating deletions
  on your own account. Use at your own risk and review OpenAI's terms.
- Undocumented internal API changes that break the extension; report those as bugs.
- Attacks that already require control of your browser profile or your machine.

## Design choices that reduce risk

- **No background page, no service worker.** All logic runs in one content script
  scoped to `chatgpt.com`.
- **Shadow DOM** for the UI, with conversation titles inserted only via
  `textContent`. There is exactly one `innerHTML` use, a static skeleton with no
  interpolated data.
- **Token in memory only**, fetched per run from the page's own session endpoint.
- **One `DELETE` per selected ID**, no bulk endpoint, no `delete all` code path.
- **Frozen target list** captured when you confirm; later UI changes cannot add to it.
- **Post-run reconciliation**: the server total must drop by exactly the number of
  successful deletes, otherwise the panel warns you.
- **Automated guard** (`npm run guard`) fails CI on unexpected URLs, `eval`,
  `new Function`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, or credential-shaped
  strings in the source.

## Verifying a release

```bash
npm ci
npm test          # manifest checks, guard, e2e against a fake site, layout
sha256sum -c SHA256SUMS.txt   # for release artifacts
```

Release zips are built from the tagged commit by GitHub Actions; the workflow is in
`.github/workflows/release.yml`.
