/* Panel UI. Shadow-DOM isolated. User content is only ever inserted via textContent. */
(() => {
  const CGB = globalThis.CGB;
  const { util } = CGB;
  const api = CGB.api;

  const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

.fab {
  position: fixed; right: 16px; bottom: 92px; z-index: 2147483647;
  pointer-events: auto;
  font: 600 12px/1 -apple-system, "Segoe UI", system-ui, sans-serif;
  color: #fff; background: #b3401a; border: 0; border-radius: 999px;
  padding: 9px 14px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,.4);
}
.fab:hover { background: #d1491f; }

.overlay { position: fixed; inset: 0; pointer-events: none; }

.panel {
  pointer-events: auto;
  position: absolute; right: 16px; bottom: 60px;
  width: min(440px, calc(100vw - 32px));
  max-height: min(74vh, 660px);
  display: flex; flex-direction: column;
  background: #171717; color: #ececec;
  border: 1px solid #3b3b3b; border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
  font: 13px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}

.head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #2c2c2c; }
.head h1 { margin: 0; font-size: 13px; font-weight: 650; }
.head .total { margin-left: auto; color: #9b9b9b; font-size: 11px; }
.icon { background: transparent; border: 0; color: #9b9b9b; font-size: 18px; line-height: 1; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
.icon:hover { background: #2a2a2a; color: #fff; }

.row-tools { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #242424; }

input[type="search"], input[type="number"], #cinput {
  background: #101010; color: #ececec; border: 1px solid #3a3a3a;
  border-radius: 8px; padding: 6px 9px; font: inherit;
}
input[type="search"] { flex: 1; min-width: 0; }
input:focus { outline: 2px solid #b3401a; outline-offset: 1px; }

.chk { display: inline-flex; align-items: center; gap: 6px; color: #b9b9b9; font-size: 12px; white-space: nowrap; cursor: pointer; user-select: none; }
.chk input { accent-color: #b3401a; }

.btn {
  font: inherit; font-size: 12px; border-radius: 8px; border: 1px solid #3a3a3a;
  background: #222; color: #ececec; padding: 6px 10px; cursor: pointer;
}
.btn:hover:not(:disabled) { background: #2e2e2e; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.ghost { background: transparent; }
.btn.danger { background: #b3401a; border-color: #b3401a; color: #fff; font-weight: 600; }
.btn.danger:hover:not(:disabled) { background: #d1491f; }

.list { flex: 1; overflow: auto; min-height: 90px; }

.row { display: flex; gap: 10px; padding: 8px 12px; cursor: pointer; border-left: 3px solid transparent; }
.row:hover { background: #212121; }
.row.sel { background: #26190f; border-left-color: #b3401a; }
.row:focus-visible { outline: 2px solid #b3401a; outline-offset: -2px; }

.box { width: 15px; height: 15px; margin-top: 2px; border: 1.5px solid #5a5a5a; border-radius: 4px; flex: 0 0 auto; display: grid; place-items: center; }
.row.sel .box { background: #b3401a; border-color: #b3401a; }
.row.sel .box::after { content: ""; width: 7px; height: 4px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translate(.5px, -1px); }

.meta { min-width: 0; flex: 1; }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub { color: #8f8f8f; font-size: 11px; margin-top: 1px; }
.empty { padding: 18px 14px; color: #8f8f8f; text-align: center; }

.foot { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-top: 1px solid #2c2c2c; background: #1b1b1b; }
.selcount { font-size: 12px; color: #b9b9b9; }
.selcount b { color: #fff; }
.foot .btn.danger { margin-left: auto; }

.fine { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 8px 12px; border-top: 1px solid #242424; color: #8f8f8f; font-size: 11px; }
.fine label { display: inline-flex; align-items: center; gap: 5px; }
.fine input[type="number"] { width: 64px; padding: 4px 6px; font-size: 11px; }
.fine #exportlog { margin-left: auto; font-size: 11px; padding: 4px 8px; }
.fine #clearstorage { font-size: 11px; padding: 4px 8px; }

.note { padding: 6px 12px 8px; color: #7a7a7a; font-size: 10.5px; text-align: center; border-top: 1px solid #242424; }

.status { padding: 8px 12px; font-size: 11.5px; color: #cfcfcf; background: #141414; border-top: 1px solid #242424; max-height: 96px; overflow: auto; }
.status.err { color: #ffb4a2; background: #2a1410; }

.confirm {
  pointer-events: auto;
  position: fixed; inset: 0; display: grid; place-items: center;
  background: rgba(0,0,0,.55); z-index: 2147483647;
}
.card {
  width: min(420px, calc(100vw - 32px));
  background: #1b1b1b; border: 1px solid #3b3b3b; border-radius: 14px;
  padding: 16px; color: #ececec;
  font: 13px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif;
  box-shadow: 0 24px 70px rgba(0,0,0,.6);
}
.card h2 { margin: 0 0 6px; font-size: 15px; }
.card p { margin: 0 0 10px; color: #b9b9b9; font-size: 12px; }
.card p.warn { color: #ffb4a2; }
.titles { max-height: 140px; overflow: auto; border: 1px solid #333; border-radius: 8px; padding: 6px 8px; margin-bottom: 10px; background: #131313; }
.titles .ti { font-size: 12px; padding: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.titles .ti.muted { color: #8f8f8f; }
.cardfoot { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
#cinput { width: 100%; }
`;

  const state = {
    items: [],
    selected: new Set(),
    filter: '',
    lastClickedId: null,
    includeArchived: false,
    cap: 25,
    delay: 400,
    dryRun: true,
    busy: false,
    abort: false,
    pending: [],
    log: [],
  };

  let shadow = null;
  const els = {};

  /* ---------- helpers ---------- */

  function setStatus(message, isError) {
    els.status.hidden = false;
    els.status.textContent = message;
    els.status.classList.toggle('err', Boolean(isError));
  }

  function visibleItems() {
    const needle = state.filter.trim().toLowerCase();
    if (!needle) return state.items;
    return state.items.filter((item) => item.title.toLowerCase().includes(needle));
  }

  function byId(id) {
    return state.items.find((item) => item.id === id) || null;
  }

  function removeLocal(id) {
    state.items = state.items.filter((item) => item.id !== id);
    state.selected.delete(id);
  }

  /* ---------- rendering ---------- */

  function render() {
    const visible = visibleItems();
    const scrollTop = els.list.scrollTop;

    els.list.textContent = '';
    if (!state.items.length) {
      els.list.appendChild(util.el('div', 'empty', 'No chats loaded. Click Reload.'));
    } else if (!visible.length) {
      els.list.appendChild(util.el('div', 'empty', 'No titles match.'));
    } else {
      for (const item of visible) els.list.appendChild(rowFor(item, visible));
    }
    els.list.scrollTop = scrollTop;

    els.total.textContent = state.items.length ? state.items.length + ' chats' : '—';
    els.shown.textContent = String(visible.length);
    els.selcount.textContent = String(state.selected.size);

    els.delete.disabled = state.busy ? false : state.selected.size === 0;
    els.delete.textContent = state.busy ? 'Abort' : state.dryRun ? 'Dry run' : 'Delete';
    els.delete.classList.toggle('danger', !state.busy);

    const allSelected =
      visible.length > 0 && visible.every((item) => state.selected.has(item.id));
    els.selectall.checked = allSelected;

    const locked = state.busy;
    els.reload.disabled = locked;
    els.archived.disabled = locked;
    els.clearsel.disabled = locked;
    els.selectall.disabled = locked;
    els.search.disabled = locked;
    els.cap.disabled = locked;
    els.delay.disabled = locked;
    els.dryrun.disabled = locked;
    els.clearstorage.disabled = locked;
  }

  function rowFor(item, visible) {
    const selected = state.selected.has(item.id);
    const row = util.el('div', 'row' + (selected ? ' sel' : ''));
    row.tabIndex = 0;
    row.setAttribute('role', 'checkbox');
    row.setAttribute('aria-checked', selected ? 'true' : 'false');
    row.dataset.id = item.id;

    const box = util.el('span', 'box');
    box.setAttribute('aria-hidden', 'true');
    row.appendChild(box);

    const meta = util.el('div', 'meta');
    const title = util.el('div', 'title', item.title);
    title.title = item.title;
    meta.appendChild(title);

    const bits = [];
    if (item.archived) bits.push('archived');
    if (item.pinned) bits.push('pinned');
    if (item.gizmo) bits.push('project');
    const when = util.fmtDate(item.update_time || item.create_time);
    meta.appendChild(util.el('div', 'sub', [when, ...bits].filter(Boolean).join(' · ')));
    row.appendChild(meta);

    row.addEventListener('click', (event) => toggleItem(item.id, visible, event));
    row.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggleItem(item.id, visible, event);
      }
    });

    return row;
  }

  function toggleItem(id, visible, event) {
    if (state.busy) return;

    if (event.shiftKey && state.lastClickedId) {
      const from = visible.findIndex((item) => item.id === state.lastClickedId);
      const to = visible.findIndex((item) => item.id === id);
      if (from >= 0 && to >= 0) {
        const start = Math.min(from, to);
        const end = Math.max(from, to);
        const select = !state.selected.has(id);
        for (let i = start; i <= end; i++) {
          if (select) state.selected.add(visible[i].id);
          else state.selected.delete(visible[i].id);
        }
        state.lastClickedId = id;
        render();
        return;
      }
    }

    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    state.lastClickedId = id;
    render();
  }

  /* ---------- data ---------- */

  async function loadList({ quiet = false } = {}) {
    if (!quiet) setStatus('Loading chats…');
    try {
      const auth = await api.getToken();
      const main = await api.listAll(auth, { archived: false });
      let items = main.items;
      let archivedCount = 0;

      if (state.includeArchived) {
        const archived = await api.listAll(auth, { archived: true });
        archivedCount = archived.items.length;
        const ids = new Set(items.map((item) => item.id));
        items = items.concat(archived.items.filter((item) => !ids.has(item.id)));
      }

      state.items = items.sort(
        (a, b) => (b.update_time || 0) - (a.update_time || 0)
      );
      state.selected.clear();
      state.lastClickedId = null;
      render();

      if (!quiet) {
        setStatus(
          'Loaded ' +
            main.items.length +
            (main.items.length === 1 ? ' chat' : ' chats') +
            (state.includeArchived ? ' + ' + archivedCount + ' archived' : '') +
            '.'
        );
      }
      return true;
    } catch (error) {
      if (!quiet) setStatus(String(error.message || error), true);
      return false;
    }
  }

  /* ---------- delete flow ---------- */

  function openConfirm() {
    const targets = state.items.filter((item) => state.selected.has(item.id));
    if (!targets.length) return;

    if (targets.length > state.cap) {
      setStatus(
        'Selected ' +
          targets.length +
          ', but the batch cap is ' +
          state.cap +
          '. Raise the cap below or select fewer.',
        true
      );
      return;
    }

    state.pending = targets;
    const n = targets.length;

    els.ctitle.textContent =
      (state.dryRun ? 'Dry run: ' : 'Delete ') + n + (n === 1 ? ' chat' : ' chats');
    els.csub.textContent = state.dryRun
      ? 'Nothing will be deleted. This only lists what would be sent.'
      : 'This permanently deletes these chats, including files uploaded or generated in them. It cannot be undone.';

    els.ctitles.textContent = '';
    for (const target of targets.slice(0, 50)) {
      els.ctitles.appendChild(util.el('div', 'ti', target.title));
    }
    if (n > 50) {
      els.ctitles.appendChild(util.el('div', 'ti muted', '…and ' + (n - 50) + ' more'));
    }

    els.cnum.textContent = String(n);
    els.cinput.value = '';
    els.cinput.placeholder = String(n);
    els.cok.textContent = state.dryRun ? 'Run dry run' : 'Delete permanently';
    els.cok.disabled = !state.dryRun;
    els.confirm.hidden = false;
    if (!state.dryRun) setTimeout(() => els.cinput.focus(), 0);
  }

  function closeConfirm() {
    els.confirm.hidden = true;
    state.pending = [];
  }

  async function runDelete(targets) {
    state.busy = true;
    state.abort = false;
    state.log = [];
    render();
    setStatus(state.dryRun ? 'Dry run…' : 'Starting…');

    let okCount = 0;
    let failCount = 0;
    let before = null;
    let after = null;
    let mismatch = false;

    try {
      const auth = await api.getToken();
      let archivedBefore = null;
      if (!state.dryRun) {
        before = await api.count(auth, false).catch(() => null);
        archivedBefore = state.includeArchived
          ? await api.count(auth, true).catch(() => null)
          : null;
      }

      for (let i = 0; i < targets.length; i++) {
        if (state.abort) break;
        const target = targets[i];
        setStatus(
          (state.dryRun ? 'Would delete ' : 'Deleting ') +
            (i + 1) +
            '/' +
            targets.length +
            ': ' +
            target.title
        );

        if (state.dryRun) {
          okCount++;
          state.log.push({
            id: target.id,
            title: target.title,
            action: 'dry-run',
            at: Date.now(),
          });
          continue;
        }

        try {
          const result = await api.deleteOne(auth, target.id);
          if (result.ok) {
            okCount++;
            state.log.push({
              id: target.id,
              title: target.title,
              action: 'delete',
              status: result.status,
              at: Date.now(),
            });
            removeLocal(target.id);
            render();
          } else {
            failCount++;
            state.log.push({
              id: target.id,
              title: target.title,
              action: 'delete',
              status: result.status,
              error: result.error || 'HTTP ' + result.status,
              at: Date.now(),
            });
          }
        } catch (error) {
          failCount++;
          state.log.push({
            id: target.id,
            title: target.title,
            action: 'delete',
            error: String(error.message || error),
            at: Date.now(),
          });
          if (error.fatal) {
            setStatus(String(error.message || error), true);
            break;
          }
        }

        if (i < targets.length - 1) {
          await util.sleep(util.jitter(state.delay));
        }
      }

      let summary;
      if (state.dryRun) {
        summary = 'Dry run: ' + okCount + ' of ' + targets.length + ' would be deleted. No requests sent.';
      } else {
        summary =
          'Done: ' +
          okCount +
          ' deleted, ' +
          failCount +
          ' failed of ' +
          targets.length +
          '.';
        after = await api.count(auth, false).catch(() => null);
        const archivedAfter = state.includeArchived
          ? await api.count(auth, true).catch(() => null)
          : null;

        if (before !== null && after !== null) {
          const delta =
            before +
            (archivedBefore || 0) -
            (after + (archivedAfter || 0));
          summary += ' Server total ' + before + ' → ' + after + ' (Δ' + delta + ').';
          if (delta !== okCount) {
            summary += ' Expected Δ' + okCount + ' — mismatch, check before continuing.';
            mismatch = true;
          }
        }
        if (state.abort) summary = 'Aborted. ' + summary;
      }

      state.selected.clear();
      state.lastClickedId = null;
      await loadList({ quiet: true });
      setStatus(summary, mismatch);
      await util.storageSet('cgb.lastRun', {
        finishedAt: Date.now(),
        requested: targets.length,
        deleted: okCount,
        failed: failCount,
        dryRun: state.dryRun,
      });
    } catch (error) {
      setStatus(String(error.message || error), true);
    } finally {
      state.busy = false;
      state.abort = false;
      state.pending = [];
      render();
    }
  }

  /* ---------- settings ---------- */

  async function loadSettings() {
    const saved = await util.storageGet('cgb.settings');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(saved.cap)) state.cap = Math.min(500, Math.max(1, saved.cap));
      if (Number.isFinite(saved.delay)) state.delay = Math.min(5000, Math.max(150, saved.delay));
      if (typeof saved.dryRun === 'boolean') state.dryRun = saved.dryRun;
    }
    els.cap.value = String(state.cap);
    els.delay.value = String(state.delay);
    els.dryrun.checked = state.dryRun;
    render();
  }

  async function saveSettings() {
    await util.storageSet('cgb.settings', {
      cap: state.cap,
      delay: state.delay,
      dryRun: state.dryRun,
    });
  }

  /* ---------- build ---------- */

  function build() {
    const host = document.createElement('div');
    host.id = 'cgb-host';
    host.style.cssText =
      'all: initial; display: block; position: fixed; inset: 0; pointer-events: none; z-index: 2147483646;';

    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button class="fab" id="fab" title="Bulk delete my chats">Bulk delete</button>
      <div class="overlay" id="overlay" hidden>
        <section class="panel" aria-label="Bulk delete ChatGPT chats">
          <header class="head">
            <h1>Bulk delete</h1>
            <span class="total" id="total">—</span>
            <button class="icon" id="close" title="Close">×</button>
          </header>
          <div class="row-tools">
            <input id="search" type="search" placeholder="Search titles…" />
            <label class="chk"><input type="checkbox" id="archived" /> Archived</label>
            <button class="btn ghost" id="reload">Reload</button>
          </div>
          <div class="row-tools">
            <label class="chk"><input type="checkbox" id="selectall" /> Select all shown (<span id="shown">0</span>)</label>
            <button class="btn ghost" id="clearsel">Clear</button>
          </div>
          <div class="list" id="list"></div>
          <div class="status" id="status" role="status" aria-live="polite" hidden></div>
          <footer class="foot">
            <span class="selcount"><b id="selcount">0</b> selected</span>
            <label class="chk"><input type="checkbox" id="dryrun" checked /> Dry run</label>
            <button class="btn danger" id="delete" disabled>Delete</button>
          </footer>
          <div class="fine">
            <label>Cap <input id="cap" type="number" min="1" max="500" value="25" /></label>
            <label>Delay <input id="delay" type="number" min="150" max="5000" step="50" value="400" /> ms</label>
            <button class="btn ghost" id="exportlog">Export log</button>
            <button class="btn ghost" id="clearstorage">Clear data</button>
          </div>
          <div class="note">Unofficial · not affiliated with OpenAI · talks only to chatgpt.com</div>
        </section>
      </div>
      <div class="confirm" id="confirm" hidden>
        <div class="card" role="alertdialog" aria-modal="true">
          <h2 id="ctitle">Delete</h2>
          <p class="warn" id="csub"></p>
          <div class="titles" id="ctitles"></div>
          <p>Type <b id="cnum">0</b> to confirm:</p>
          <input id="cinput" autocomplete="off" inputmode="numeric" />
          <div class="cardfoot">
            <button class="btn ghost" id="ccancel">Cancel</button>
            <button class="btn danger" id="cok" disabled>Delete permanently</button>
          </div>
        </div>
      </div>
    `;
    shadow.appendChild(wrap);

    for (const id of [
      'fab', 'overlay', 'close', 'search', 'archived', 'reload', 'selectall',
      'clearsel', 'list', 'status', 'selcount', 'dryrun', 'delete', 'cap',
      'delay', 'exportlog', 'clearstorage', 'confirm', 'ctitle', 'csub', 'ctitles', 'cnum',
      'cinput', 'ccancel', 'cok', 'total', 'shown',
    ]) {
      els[id] = shadow.getElementById(id);
    }

    const target = document.body || document.documentElement;
    target.appendChild(host);

    wire();
    render();
    loadSettings();
    render();
  }

  function openPanel() {
    els.overlay.hidden = false;
    els.fab.hidden = true;
    if (!state.items.length) loadList();
  }

  function closePanel() {
    els.overlay.hidden = true;
    els.fab.hidden = false;
  }

  function wire() {
    els.fab.addEventListener('click', openPanel);

    els.close.addEventListener('click', closePanel);

    let searchTimer = null;
    els.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filter = els.search.value;
        render();
      }, 120);
    });

    els.archived.addEventListener('change', () => {
      state.includeArchived = els.archived.checked;
      loadList();
    });

    els.reload.addEventListener('click', () => loadList());

    els.clearsel.addEventListener('click', () => {
      state.selected.clear();
      state.lastClickedId = null;
      render();
    });

    els.selectall.addEventListener('change', () => {
      const visible = visibleItems();
      if (els.selectall.checked) {
        for (const item of visible) state.selected.add(item.id);
      } else {
        for (const item of visible) state.selected.delete(item.id);
      }
      render();
    });

    els.dryrun.addEventListener('change', () => {
      state.dryRun = els.dryrun.checked;
      saveSettings();
      render();
    });

    els.cap.addEventListener('change', () => {
      const value = Number(els.cap.value);
      state.cap = Number.isFinite(value) ? Math.min(500, Math.max(1, Math.round(value))) : 25;
      els.cap.value = String(state.cap);
      saveSettings();
      render();
    });

    els.delay.addEventListener('change', () => {
      const value = Number(els.delay.value);
      state.delay = Number.isFinite(value)
        ? Math.min(5000, Math.max(150, Math.round(value)))
        : 400;
      els.delay.value = String(state.delay);
      saveSettings();
    });

    els.delete.addEventListener('click', () => {
      if (state.busy) {
        state.abort = true;
        setStatus('Aborting after the current request…');
        return;
      }
      openConfirm();
    });

    els.ccancel.addEventListener('click', closeConfirm);

    els.cinput.addEventListener('input', () => {
      if (state.dryRun) return;
      els.cok.disabled =
        els.cinput.value.trim() !== String(state.pending.length);
    });

    els.cinput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !els.cok.disabled) els.cok.click();
    });

    els.cok.addEventListener('click', () => {
      const targets = state.pending.slice();
      if (!targets.length) return;
      if (!state.dryRun && els.cinput.value.trim() !== String(targets.length)) return;
      closeConfirm();
      runDelete(targets);
    });

    els.exportlog.addEventListener('click', () => {
      if (!state.log.length) {
        setStatus('No log yet — run a dry run or a delete first.');
        return;
      }
      util.download(
        'chatgpt-bulk-log-' + util.stamp() + '.json',
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            note: 'Local record only. Not a content backup.',
            settings: { cap: state.cap, delay: state.delay },
            log: state.log,
          },
          null,
          2
        )
      );
    });

    els.clearstorage.addEventListener('click', async () => {
      state.log = [];
      await util.storageRemove(['cgb.settings', 'cgb.lastRun']);
      setStatus('Cleared locally stored settings and run logs. Chats were not touched.');
    });

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape') return;
        if (!els.confirm.hidden) {
          closeConfirm();
        } else if (!els.overlay.hidden) {
          closePanel();
        }
      },
      true
    );
  }

  CGB.panel = { mount: build };
})();
