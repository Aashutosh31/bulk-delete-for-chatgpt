/* Layout smoke test: the panel is styled, positioned, and scrollable. */
import { launch, openApp, reporter } from './lib.mjs';
import { startServer } from './server.mjs';

const app = await startServer();
const { check, finish } = reporter();
const browser = await launch();
const page = await browser.newPage();

await openApp(page);
await page.evaluate(() => document.getElementById('cgb-host').shadowRoot.getElementById('fab').click());
await page.waitForFunction(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('list').children.length === 8
);

const info = await page.evaluate(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const rect = (element) => {
    const r = element.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const panel = s.querySelector('.panel');
  const rows = [...s.getElementById('list').children];
  return {
    panel: rect(panel),
    row0: rect(rows[0]),
    fabHidden: s.getElementById('fab').hidden,
    display: getComputedStyle(panel).display,
    background: getComputedStyle(panel).backgroundColor,
    overflow: getComputedStyle(s.getElementById('list')).overflowY,
    viewport: { w: innerWidth, h: innerHeight },
  };
});

check('panel is styled', info.display === 'flex' && info.background !== 'rgba(0, 0, 0, 0)');
check('panel fits the viewport', info.panel.x >= 0 && info.panel.x + info.panel.w <= info.viewport.w + 1);
check('panel is anchored bottom-right', info.panel.x + info.panel.w === info.viewport.w - 16);
check('list rows have real height', info.row0.h >= 30);
check('list scrolls', info.overflow === 'auto');
check('trigger is hidden while the panel is open', info.fabHidden === true);
check('panel does not overflow the screen', info.panel.y >= 0 && info.panel.y + info.panel.h <= info.viewport.h);

await browser.close();
await app.close();

process.exit(finish() ? 0 : 1);
