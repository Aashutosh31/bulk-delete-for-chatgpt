# Publishing

Two channels: GitHub Releases (both browsers) and Firefox AMO as an *unlisted*
add-on. Chrome Web Store is optional and not currently used.

## Version bump

Update the version in **all three** places — CI fails if they disagree:

- `manifests/manifest.firefox.json`
- `manifests/manifest.chrome.json`
- `package.json`

Then add a `CHANGELOG.md` entry and commit.

## Build

```bash
npm ci
npm test
./build.sh
sha256sum dist/*.zip > dist/SHA256SUMS.txt
```

Artifacts:

```
dist/bulk-delete-for-chatgpt-firefox-<version>.zip
dist/bulk-delete-for-chatgpt-chrome-<version>.zip
dist/SHA256SUMS.txt
```

## GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `release.yml` workflow builds and attaches the zips, checksums, and generated
notes. To do it by hand:

```bash
gh release create v1.0.0 dist/*.zip dist/SHA256SUMS.txt --generate-notes
```

## Firefox AMO (unlisted signing)

Unlisted means the add-on is signed but not publicly listed in the store. Users
install an `.xpi` you give them, and the install survives browser restarts. Free,
requires an AMO account.

1. Create an account at <https://addons.mozilla.org>.
2. Generate API credentials: <https://addons.mozilla.org/developers/addon/api/key/>.
3. Lint first:

   ```bash
   npx web-ext lint --source-dir build/firefox
   ```

4. Sign:

   ```bash
   npx web-ext sign \
     --source-dir build/firefox \
     --channel unlisted \
     --api-key "$AMO_JWT_ISSUER" \
     --api-secret "$AMO_JWT_SECRET" \
     --artifacts-dir dist
   ```

   This produces `dist/bulk_delete_for_chatgpt-<version>-an+fx.xpi`.

5. Attach the `.xpi` to the GitHub Release and link it from the README.

**Never commit the API key or secret.** Put them in your shell environment or in
GitHub Actions secrets (`AMO_JWT_ISSUER`, `AMO_JWT_SECRET`). The repository's CI
does not sign releases by default; signing is a manual step.

### Extension ID

`bulk-delete-for-chatgpt@aashutosh31.github.io`

Keep this stable across releases. Changing it makes Firefox treat the add-on as a
different extension, so existing installs will not update.

## Chrome Web Store (optional)

Not used today. If you want it later:

1. Register a Chrome Web Store developer account (one-time $5).
2. Upload `dist/bulk-delete-for-chatgpt-chrome-<version>.zip`.
3. Set the privacy policy URL to
   `https://github.com/Aashutosh31/bulk-delete-for-chatgpt/blob/main/PRIVACY.md`.
4. Single-purpose description: *"Select and permanently delete your own ChatGPT
   conversations in bulk."*
5. Host permission justification: *"Required to read the user's own conversation
   list and issue one delete request per conversation the user selects. The
   extension contacts no other host."*
6. Data usage: the extension collects nothing; do not tick any collection category.
7. Expect review delays; automation tools for third-party sites can be questioned.
   GitHub Releases remains the fallback.

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

- Update the README install section with the `.xpi` link.
- Post release notes with the checksum file so users can verify.
- Never publish screenshots containing real conversation titles; regenerate them with
  `npm run screenshots`, which uses fake data.
