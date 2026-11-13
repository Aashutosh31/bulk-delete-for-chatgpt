/* The only module that talks to the network, and only to chatgpt.com. */
(() => {
  const CGB = globalThis.CGB;
  const ORIGIN = 'https://chatgpt.com';
  const RETRY_DELAY = 700;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function deviceId() {
    const match = document.cookie.match(/(?:^|;\s*)oai-did=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function headers(auth) {
    const h = {
      authorization: 'Bearer ' + auth.token,
      accept: '*/*',
      'oai-language': 'en-US',
    };
    if (auth.accountId) h['chatgpt-account-id'] = auth.accountId;
    const did = deviceId();
    if (did) {
      h['oai-did'] = did;
      h['oai-device-id'] = did;
    }
    return h;
  }

  function unauthorized() {
    const error = new Error('Unauthorized (401). Reload chatgpt.com and log in again.');
    error.fatal = true;
    return error;
  }

  function rateLimited() {
    const error = new Error('Rate limited (429). Stopped. Wait a minute, then resume.');
    error.fatal = true;
    return error;
  }

  /* Reads the live session token from the page itself. Never stored, never sent elsewhere. */
  async function getToken() {
    let res;
    try {
      res = await fetch(ORIGIN + '/api/auth/session', {
        credentials: 'include',
        headers: { accept: 'application/json' },
      });
    } catch {
      throw new Error('Could not reach /api/auth/session. Are you on chatgpt.com and logged in?');
    }
    if (!res.ok) {
      throw new Error(
        'Session check failed: HTTP ' + res.status + '. Reload chatgpt.com and try again.'
      );
    }
    const data = await res.json().catch(() => null);
    if (!data) {
      throw new Error(
        'Session endpoint did not return JSON. Reload chatgpt.com and confirm you are logged in.'
      );
    }
    const token = data.accessToken || data.access_token;
    if (!token) {
      throw new Error('No access token returned by /api/auth/session. Reload the page.');
    }
    const accountId = (data.account && data.account.id) || data.account_id || null;
    return { token, accountId };
  }

  /* One retry for transient failures (network, 5xx). Never retries auth or rate limits. */
  async function listPage(auth, { offset = 0, limit = 50, archived = false } = {}) {
    const query = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
      order: 'updated',
    });
    if (archived) query.set('is_archived', 'true');
    const url = ORIGIN + '/backend-api/conversations?' + query.toString();

    let lastError = new Error('Conversation list failed.');
    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await fetch(url, { credentials: 'include', headers: headers(auth) });
      } catch {
        lastError = new Error('Network error while listing conversations.');
        if (attempt === 0) {
          await wait(RETRY_DELAY);
          continue;
        }
        break;
      }
      if (res.status === 401) throw unauthorized();
      if (res.status === 429) throw rateLimited();
      if (res.ok) return res.json();

      lastError = new Error('Conversation list failed: HTTP ' + res.status);
      if (res.status < 500) break;
      if (attempt === 0) await wait(RETRY_DELAY);
    }
    throw lastError;
  }

  /* Pages through the whole history. Returns light objects, drops the message tree. */
  async function listAll(auth, { archived = false, limit = 50, onProgress } = {}) {
    const items = [];
    const seen = new Set();
    let offset = 0;
    let total = Infinity;

    for (let guard = 0; guard < 300; guard++) {
      const data = await listPage(auth, { offset, limit, archived });
      const batch = Array.isArray(data.items) ? data.items : [];
      if (typeof data.total === 'number') total = data.total;

      for (const row of batch) {
        if (!row || !row.id || seen.has(row.id)) continue;
        seen.add(row.id);
        items.push({
          id: row.id,
          title:
            typeof row.title === 'string' && row.title.trim() ? row.title : '(untitled)',
          create_time: row.create_time || 0,
          update_time: row.update_time || row.create_time || 0,
          pinned: Boolean(row.pinned_time),
          gizmo: row.gizmo_id || null,
          archived: Boolean(archived),
        });
      }

      if (typeof onProgress === 'function') onProgress(items.length, total);

      offset = (typeof data.offset === 'number' ? data.offset : offset) + batch.length;
      if (!batch.length || offset >= total) break;
    }

    return { items, total };
  }

  async function count(auth, archived = false) {
    const data = await listPage(auth, { offset: 0, limit: 1, archived });
    return typeof data.total === 'number' ? data.total : null;
  }

  /* One conversation, one request. There is no bulk endpoint anywhere in this code. */
  async function deleteOne(auth, id) {
    const url =
      ORIGIN +
      '/backend-api/conversation/id/' +
      encodeURIComponent(id) +
      '?delete_generated_artifacts=true&delete_uploaded_artifacts=true';

    let last = { ok: false, status: 0, error: 'network error' };

    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await fetch(url, {
          method: 'DELETE',
          credentials: 'include',
          headers: headers(auth),
        });
      } catch {
        last = { ok: false, status: 0, error: 'network error' };
        if (attempt === 0) {
          await wait(RETRY_DELAY);
          continue;
        }
        return last;
      }

      if (res.status === 401) throw unauthorized();
      if (res.status === 429) throw rateLimited();
      if (res.ok) return { ok: true, status: res.status };

      /* A retried delete of something already gone is a success, not a failure. */
      if (res.status === 404 && attempt === 1) {
        return { ok: true, status: 404, alreadyGone: true };
      }

      last = { ok: false, status: res.status, error: 'HTTP ' + res.status };
      if (res.status < 500) return last;
      if (attempt === 0) await wait(RETRY_DELAY);
    }

    return last;
  }

  CGB.api = { getToken, listAll, count, deleteOne };
})();
