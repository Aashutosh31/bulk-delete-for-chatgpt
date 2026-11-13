/* Generates README screenshots from fake data. Never use real chats. */
import fs from 'node:fs';
import path from 'node:path';
import { launch, openApp, ROOT } from './lib.mjs';
import { startServer } from './server.mjs';

const docs = path.join(ROOT, 'docs');
fs.mkdirSync(docs, { recursive: true });

const app = await startServer();
const browser = await launch();
const page = await browser.newPage();
/* AMO recommends 1280x800 screenshots. */
await page.setViewport({ width: 1280, height: 800 });

await openApp(page);
await page.evaluate(() => document.getElementById('cgb-host').shadowRoot.getElementById('fab').click());
await page.waitForFunction(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('list').children.length === 8
);
await page.evaluate(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const rows = [...s.getElementById('list').children];
  rows[0].click();
  rows[1].click();
  rows[2].click();
});
await page.screenshot({ path: path.join(docs, 'screenshot-panel.png') });

await page.evaluate(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const dry = s.getElementById('dryrun');
  dry.checked = false;
  dry.dispatchEvent(new Event('change', { bubbles: true }));
  s.getElementById('delete').click();
});
await new Promise((resolve) => setTimeout(resolve, 250));
await page.screenshot({ path: path.join(docs, 'screenshot-confirm.png') });

await browser.close();
await app.close();

console.log('wrote docs/screenshot-panel.png and docs/screenshot-confirm.png');
