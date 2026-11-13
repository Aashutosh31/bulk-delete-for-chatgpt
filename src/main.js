/* Entry point. Mounts once; tolerates SPA navigation. */
(() => {
  const CGB = globalThis.CGB;
  if (!CGB || !CGB.panel) return;
  if (document.getElementById('cgb-host')) return;

  const start = () => {
    if (document.getElementById('cgb-host')) return;
    CGB.panel.mount();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
