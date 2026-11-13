# Publishing

## Channels

| Channel | Status | Who installs |
|---|---|---|
| **Firefox AMO, listed** | Primary | Anyone: one click, auto-updates |
| **GitHub Releases** | Always | Firefox manual install, Chrome/Edge/Brave |
| Firefox AMO, unlisted | Fallback | Only if the listed review fails |
| Chrome Web Store | Not used | — |

Chrome's store charges developers a one-time fee, so this project stays GitHub-only
on Chrome and documents the unpacked install instead. There is nothing to publish
for Chrome.

## Version bump

Update the version in **all three** places; CI fails if they disagree:

- `manifests/manifest.firefox.json`
- `manifests/manifest.chrome.json`
- `package.json`

Then add a `CHANGELOG.md` entry and commit.

AMO rejects a version it has already received for the same add-on, so a re-upload
after a rejection needs the next patch version (`1.0.1`).

## Build and verify

```bash
npm ci
npm test                     # builds, then check + guard + e2e + layout
npx web-ext lint --source-dir build/firefox
sha256sum dist/*.zip > dist/SHA256SUMS.txt
```

`web-ext lint` must report **0 errors and 0 warnings** before submitting. The
manifest declares `data_collection_permissions`, which needs Firefox 140 (142 on
Android); `strict_min_version` reflects that on purpose.

## GitHub Release

```bash
git tag -a v1.0.0 -m "Bulk Delete for ChatGPT 1.0.0"
git push origin v1.0.0
```

`.github/workflows/release.yml` builds the zips, writes `SHA256SUMS.txt`, and
publishes the release. To do it by hand:

```bash
gh release create v1.0.0 dist/*.zip dist/SHA256SUMS.txt --generate-notes
```

## Firefox AMO: listed submission (primary)

Listed means the add-on appears in Mozilla's store, installs with one click, and
updates itself. Free.

### Before you start

- An AMO account: <https://addons.mozilla.org>
- A verified email on that account

You do **not** need API keys for a web submission. Keys are only for the `web-ext`
CLI and must never be committed to the repository.

### Submit

1. Open <https://addons.mozilla.org/developers/addon/submit/distribution>.
2. Choose **On this site** (listed), then **Continue**.
3. Upload `dist/bulk-delete-for-chatgpt-firefox-<version>.zip`.
4. Choose **No** for "Do you use a build tool?" — the zip contains plain,
   unminified source in `src/`.
5. Fill the listing with the sheet below.
6. Upload both screenshots from `docs/` (`screenshot-panel.png` and
   `screenshot-confirm.png`, 1280×800).
7. Paste the reviewer notes, then submit.

### Copy-paste sheet

| Field | Value |
|---|---|
| Name | Bulk Delete for ChatGPT |
| Summary | Select and permanently delete your own ChatGPT conversations in bulk. Open source, no telemetry, no servers. |
| Category | Productivity |
| Tags | chatgpt, delete, conversations, privacy, bulk |
| License | MIT |
| Homepage | `https://github.com/Aashutosh31/bulk-delete-for-chatgpt` |
| Support site | `https://github.com/Aashutosh31/bulk-delete-for-chatgpt/issues` |
| Support email | `aashutosh.bairagi05@gmail.com` |
| Privacy policy | `https://github.com/Aashutosh31/bulk-delete-for-chatgpt/blob/main/PRIVACY.md` |
| Requires an account on another service | Yes — a ChatGPT account |
| Data collection | None |
| Remote code | No |

### Reviewer notes

> Bulk Delete for ChatGPT lets a signed-in user remove their own ChatGPT
> conversations. It is user-initiated: nothing is deleted until the user ticks
> specific rows, presses Delete, and types the number of selected chats to confirm.
>
> There is no bulk delete endpoint and no "delete all" code path. Each deletion is
> one `DELETE /backend-api/conversation/id/{id}` request, sent sequentially with a
> delay. The access token is read from the page's own `/api/auth/session` response
> and kept in memory for that run only; it is never stored or sent to any other
> host.
>
> Storage holds only a settings object (batch cap, delay, dry-run flag) and counts
> from the previous run. No titles, conversation IDs, or tokens are persisted. The
> extension contacts no host other than `chatgpt.com`, loads no remote code, and has
> no analytics.
>
> A logged-in ChatGPT account is required to do anything; without a session the
> panel shows an error and stops. To see the UI without deleting: load the add-on,
> open `chatgpt.com` while signed in, click the "Bulk delete" pill at the bottom
> right, leave "Dry run" ticked, and press the Dry run button — no DELETE requests
> are sent.
>
> The source is four unminified files in `src/`. `npm run guard` fails the build if
> a non-`chatgpt.com` URL, `eval`, `XMLHttpRequest`, or a persisted token appears.

### What review can ask for

- **A test account.** We cannot provide one. Point to the unminified source and the
  reviewer notes; the add-on only acts on a real signed-in session.
- **A new version.** If a reviewer asks for a code change, bump to `1.0.1`, rebuild,
  and upload again. Version numbers cannot be reused.
- **Trademark wording.** If the name is questioned, add "Unofficial" to the store
  name. The description already says it is not affiliated with OpenAI.

Typical first review: a few days, occasionally one to two weeks.

### After approval

- AMO gives a public listing URL, usually
  `https://addons.mozilla.org/firefox/addon/bulk-delete-for-chatgpt/`.
- Replace the `<!-- AMO-LINK -->` block in `README.md` with the live **Add to
  Firefox** link, and update the Firefox section of `HOW-TO-USE.md`.
- Set the GitHub repository homepage to the listing URL.
- Add a line to `CHANGELOG.md` noting the store listing.
- Future versions: upload the new zip on the AMO developer page, or sign with
  `web-ext sign --channel listed` using keys from
  <https://addons.mozilla.org/developers/addon/api/key/>.

## Fallback: unlisted signing

Only if listed review fails. Unlisted is signed but not searchable, so users need
the `.xpi` link from the GitHub release.

```bash
npx web-ext sign \
  --source-dir build/firefox \
  --channel unlisted \
  --api-key "$AMO_JWT_ISSUER" \
  --api-secret "$AMO_JWT_SECRET" \
  --artifacts-dir dist
```

Attach the resulting `.xpi` to the release. Keep the API key and secret in your
shell or GitHub Actions secrets — never in the repository.

### Extension ID

`bulk-delete-for-chatgpt@aashutosh31.github.io`

Keep it stable. Changing it makes Firefox treat the add-on as a different
extension, so existing installs stop updating.

## Chrome

No store submission. Users install the unpacked Chrome build from the GitHub
release; `README.md` and `HOW-TO-USE.md` cover the six clicks. If a store listing is
ever wanted, it needs a paid developer account and a privacy-policy URL; the copy
below is ready.

## Store listing copy

**Short description (≤132 chars):**

> Select and permanently delete your own ChatGPT conversations in bulk. Open source,
> no telemetry, no servers.

**Detailed description:**

> Bulk Delete for ChatGPT turns your history into a checkbox list so you can remove
> exactly the chats you choose.
>
> - Multi-select with Shift+click ranges and search
> - Dry run by default; nothing is sent until you confirm
> - Type the number of chats to confirm; batch cap per run
> - One request per chat; stops on errors; abort anytime
> - After each run it verifies the server total dropped by exactly the number deleted
>
> Privacy: the extension runs only on chatgpt.com, uses your existing session, stores
> no tokens and no chat titles, and contacts no server other than chatgpt.com. The
> source is MIT-licensed and auditable.
>
> Unofficial. Not affiliated with OpenAI.

## After publishing

- Post release notes with the checksum file so users can verify downloads.
- Never publish screenshots containing real conversation titles. Regenerate them
  with `npm run screenshots`, which uses fake data at 1280×800.
