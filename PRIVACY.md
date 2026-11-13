# Privacy policy

**Bulk Delete for ChatGPT** — effective 2026-11-13

Short version: the extension runs only on `chatgpt.com`, uses your existing browser
session, stores two small settings records locally, and sends nothing anywhere else.
There is no server, no analytics, no crash reporting, and no third-party code.

## What the extension reads

While you have `chatgpt.com` open, the extension reads:

- Your conversation list: IDs, titles, timestamps, pinned/archived flags, and
  whether a chat belongs to a custom GPT or Project. This is displayed to you.
- Your session access token, from the page's own `/api/auth/session` endpoint, at
  the start of each run. It is held **in memory only** for the duration of that run
  and is never written to storage.
- The `oai-did` cookie value, which is a random device identifier the site itself
  uses. It is copied into request headers so the site accepts the call. It is not
  stored or sent anywhere else.

## What the extension sends

Requests go only to `https://chatgpt.com`, from your browser, using your session:

| Request | Purpose |
|---|---|
| `GET /api/auth/session` | Read the current access token |
| `GET /backend-api/conversations` | List your conversations |
| `DELETE /backend-api/conversation/id/{id}` | Delete one conversation you selected |

No request is made to any other host. There is no telemetry endpoint to disable
because none exists.

## What is stored on your device

`chrome.storage.local`, two keys:

```jsonc
{
  "cgb.settings": { "cap": 25, "delay": 400, "dryRun": true },
  "cgb.lastRun":  { "finishedAt": 1760000000000, "requested": 12, "deleted": 12, "failed": 0, "dryRun": false }
}
```

Conversation titles, conversation IDs, and tokens are **not** stored. The action log
shown in the panel lives in memory and is only written to a file if you press
**Export log**. **Clear data** in the panel removes both keys.

Uninstalling the extension removes its storage.

## Permissions

- `host_permissions: https://chatgpt.com/*` — required to run on the site and make
  the calls above.
- `storage` — required for the two keys above.

The extension requests no other permissions: no `<all_urls>`, no `tabs`, no
`webRequest`, no clipboard, no downloads.

## Third parties

None. The extension loads no remote scripts, fonts, images, or styles. It contains
no analytics SDK, no advertising code, and no affiliate links. The only network
traffic is the table above.

## Data retention and deletion

Nothing is retained off your device, because nothing is sent off your device. Local
settings persist until you press **Clear data** or uninstall the extension.

## Children

The extension is not directed at children under 13 and collects no personal data
from anyone.

## Changes

Material changes to this policy will be noted in
[CHANGELOG.md](CHANGELOG.md) and in the release notes. Because the extension has no
server, a policy change can never retroactively grant access to data it did not
already have.

## Verifying this yourself

- Read the source: `src/` is about 700 lines of unminified JavaScript.
- Open DevTools → Network on `chatgpt.com` while using the panel: the only requests
  are the three in the table above.
- Run `npm run guard` — it fails the build if any URL other than `chatgpt.com`
  appears in the source.
- Run `npm test` — the end-to-end suite drives the extension against a local fake
  site and records every request it makes.

## Contact

Open an issue at
<https://github.com/Aashutosh31/bulk-delete-for-chatgpt/issues>.
For security matters, use a private advisory as described in [SECURITY.md](SECURITY.md).
Never paste tokens or session cookies into an issue.
