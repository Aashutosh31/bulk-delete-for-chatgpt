/* Small helpers. No network, no DOM queries outside the panel. */
(() => {
  const CGB = (globalThis.CGB = globalThis.CGB || {});
  const ext = globalThis.browser ?? globalThis.chrome;
  const promiseApi = typeof globalThis.browser !== 'undefined';

  CGB.util = {
    ext,

    async storageGet(key) {
      const area = ext.storage.local;
      if (promiseApi) {
        try {
          const value = await area.get(key);
          return value ? value[key] : undefined;
        } catch {
          return undefined;
        }
      }
      return new Promise((resolve) => {
        try {
          area.get(key, (value) => resolve(value ? value[key] : undefined));
        } catch {
          resolve(undefined);
        }
      });
    },

    async storageSet(key, value) {
      const area = ext.storage.local;
      if (promiseApi) {
        try {
          await area.set({ [key]: value });
        } catch {
          /* storage is optional; never break the panel over it */
        }
        return;
      }
      try {
        area.set({ [key]: value }, () => {});
      } catch {
        /* ignore */
      }
    },

    async storageRemove(keys) {
      const area = ext.storage.local;
      if (promiseApi) {
        try {
          await area.remove(keys);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        area.remove(keys, () => {});
      } catch {
        /* ignore */
      }
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    jitter(base) {
      return base + Math.floor(Math.random() * 250);
    },

    fmtDate(seconds) {
      if (!seconds) return '';
      const date = new Date(seconds * 1000);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    stamp() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        '-' +
        pad(d.getHours()) +
        pad(d.getMinutes())
      );
    },

    download(filename, text) {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },

    el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    },
  };
})();
