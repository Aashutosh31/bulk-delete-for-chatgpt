---
name: Bug report
about: Something broke, or the extension did something unexpected
title: ''
labels: bug
assignees: ''
---

## What happened

<!-- One or two sentences. What did you expect, what happened instead? -->

## The status line

<!-- Copy the exact text from the panel's status line. It contains no personal data. -->

```

```

## When

- [ ] Loading the chat list
- [ ] During a dry run
- [ ] During a real delete
- [ ] Installing / loading the extension

## Steps to reproduce

1.
2.
3.

## Environment

- Browser and version (e.g. Firefox 133):
- Extension version (Release page or `manifest.json`):
- Install method: temporary `about:debugging` / unpacked Chrome / signed `.xpi`
- Roughly how many chats are in the account:

## Did anything get deleted that you did not select?

- [ ] No
- [ ] Yes — **stop here**, do not share chat content, and open a private
      security advisory instead: https://github.com/Aashutosh31/bulk-delete-for-chatgpt/security/advisories/new

## Checklist

- [ ] I have **not** pasted an access token, cookie, `Authorization` header, or a
      screenshot containing my conversations.
- [ ] I am on the latest release.
- [ ] I searched existing issues.

<!--
Do NOT include:
  - ChatGPT access tokens or session cookies
  - Full conversation titles or IDs
  - Screenshots of your chat history

Optional, if you are comfortable: open DevTools → Network, filter to Fetch/XHR,
and report only the HTTP status codes you saw (e.g. 401, 403, 429, 500).
-->
