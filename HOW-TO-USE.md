# How to use

No technical knowledge needed. Ten minutes, start to finish. You can do the safe
test first — nothing gets deleted until Part 4, and only chats you tick.

---

## Part 0 — Before you delete anything

Chat deletion is permanent. Before a large cleanup, ask ChatGPT for a copy of your
data:

1. Open `chatgpt.com`.
2. Click your name (bottom left) → **Settings**.
3. Go to **Data controls** → **Export data** → confirm.
4. Wait for the email (usually minutes to a day), then download the file.

That export is your only backup. The extension cannot restore deleted chats.

---

## Part 1 — Install (Firefox)

1. Download `bulk-delete-for-chatgpt-firefox-<version>.zip` from the Releases page.
2. Unzip it somewhere permanent, e.g. your home folder. You should see a folder
   containing `manifest.json`, `src/`, and `icons/`.
3. In Firefox, type this in the address bar and press Enter:
   ```
   about:debugging#/runtime/this-firefox
   ```
4. Click **Load Temporary Add-on…**
5. Select the `manifest.json` file from the unzipped folder.
6. You should now see **Bulk Delete for ChatGPT** in the list.

Temporary add-ons are removed when Firefox closes. Reload it the same way next time,
or use the signed install in [docs/PUBLISHING.md](docs/PUBLISHING.md).

### Chrome instead?

1. Unzip the Chrome build.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder.

---

## Part 2 — Open the panel

1. Go to `chatgpt.com` and make sure you are logged in.
2. Press **Ctrl+R** to reload the page.
3. Bottom-right corner: a red **Bulk delete** pill. Click it.
4. The panel opens. Press **Reload** inside it.

You should see your chats with tick boxes, and a count like `66 chats` top-right.

If the pill is missing, see Troubleshooting at the end.

---

## Part 3 — Safe test (dry run)

Dry run is on by default. It sends **no** delete requests.

1. Create two throwaway chats: **New chat** → type `test 1` → send. Then `test 2`.
2. In the panel press **Reload** so they show up at the top.
3. Tick both.
4. Press the **Dry run** button at the bottom.
5. A window lists the two chats. Press **Run dry run**.
6. The status line says:
   ```
   Dry run: 2 of 2 would be deleted. No requests sent.
   ```

Nothing was deleted. You can close the panel with **×** or **Esc**.

![Confirmation dialog](docs/screenshot-confirm.png)

---

## Part 4 — Delete for real

1. Untick **Dry run**. The bottom button now says **Delete**.
2. Tick the two test chats.
3. Press **Delete**. A window lists exactly those chats.
4. Type `2` in the box. The red button becomes clickable.
5. Press **Delete permanently**.
6. Wait. The status line ends with something like:
   ```
   Done: 2 deleted, 0 failed of 2. Server total 66 → 64 (Δ2).
   ```
7. Check your normal chat list: the two test chats are gone, everything else is there.

If `Δ` is not the number you deleted, stop and open an issue — that is the
safety check telling you something unexpected happened.

---

## Doing a real cleanup

- Delete in batches. The default cap is **25 chats per run**; you can raise it in
  the panel, but small batches are easier to verify.
- Use **Shift+click** to select a range, and the search box to find groups.
- "Select all shown" only affects what the current search/archived filter shows.
- Watch the status line after every batch. It reports the total before and after.
- Names and dates come straight from ChatGPT; nothing is uploaded anywhere.

## Settings

| Setting | Meaning |
|---|---|
| **Cap** | Maximum chats per run. The delete is refused above this. |
| **Delay** | Milliseconds between requests. Default 400 ms + random jitter. Raise it if you see rate-limit errors. |
| **Dry run** | When ticked, nothing is sent. Keep it on until you are confident. |
| **Export log** | Downloads this session's actions (title, HTTP status, time) as JSON. |
| **Clear data** | Deletes the extension's saved settings and run counts from your browser. |

## Troubleshooting

| What you see | What to do |
|---|---|
| No red pill | Reload `chatgpt.com` after loading the add-on. Check the add-on is listed in `about:debugging` or `chrome://extensions`. |
| `No access token returned…` | You are logged out or the page is stale. Reload and log in. |
| `Unauthorized (401)` | Session expired. Reload the page. |
| `Rate limited (429)` | Wait a minute, then continue with a smaller batch and a larger delay. |
| Chat list is empty | Press **Reload**. If your chats are archived, tick **Archived**. |
| `Server total … mismatch` | Stop. Note the numbers and open a GitHub issue. Do not continue deleting. |
| Everything broke after a ChatGPT update | The internal API changed. Open an issue with the status message; it contains no personal data. |

## Uninstall

- Firefox temporary: close the browser, or remove it from `about:debugging`.
- Chrome: `chrome://extensions` → Remove.
- Saved settings are deleted with the extension; you can also press **Clear data**
  first.
