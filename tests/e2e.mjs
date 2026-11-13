/* End-to-end: drives the real extension against a fake chatgpt.com. */
import { launch, openApp, reporter } from './lib.mjs';
import { startServer } from './server.mjs';

const app = await startServer();
const { calls, conversations } = app;
const { check, finish } = reporter();

const browser = await launch();
const page = await browser.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') console.log('page error:', message.text());
});

const inPanel = (fn) => page.evaluate(fn);

await openApp(page);
check('content script mounts the panel', true);

await inPanel(() => document.getElementById('cgb-host').shadowRoot.getElementById('fab').click());
await page.waitForFunction(
  () => {
    const s = document.getElementById('cgb-host').shadowRoot;
    return !s.getElementById('overlay').hidden && s.getElementById('list').children.length === 8;
  },
  { timeout: 15000 }
);

const total = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('total').textContent
);
check('lists every chat', total === '8 chats', total);

const clicked = await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const rows = [...s.getElementById('list').children];
  rows[0].click();
  rows[2].click();
  return [rows[0].dataset.id, rows[2].dataset.id];
});
let selected = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('selcount').textContent
);
check('click selects rows', selected === '2', 'selected=' + selected);

await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const rows = [...s.getElementById('list').children];
  rows[rows.length - 1].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
});
selected = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('selcount').textContent
);
check('Shift+click selects a range', selected === '7', 'selected=' + selected);

/* Dry run must never send a DELETE. */
const beforeDry = conversations.size;
await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  s.getElementById('delete').click();
  s.getElementById('cok').click();
});
await page.waitForFunction(
  () =>
    document.getElementById('cgb-host').shadowRoot.getElementById('status').textContent.startsWith('Dry run:'),
  { timeout: 15000 }
);
const dryStatus = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('status').textContent
);
check('dry run sends no DELETE', calls.filter((call) => call.method === 'DELETE').length === 0);
check('dry run reports the plan', dryStatus.includes('would be deleted'), dryStatus);
check('dry run leaves data intact', conversations.size === beforeDry);

/* Real run: only ticked IDs. */
await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const dry = s.getElementById('dryrun');
  dry.checked = false;
  dry.dispatchEvent(new Event('change', { bubbles: true }));
  s.getElementById('reload').click();
});
await page.waitForFunction(
  () => {
    const s = document.getElementById('cgb-host').shadowRoot;
    return s.getElementById('status').textContent.startsWith('Loaded') &&
      s.getElementById('list').children.length === 8;
  },
  { timeout: 15000 }
);

const ticked = await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const rows = [...s.getElementById('list').children];
  rows[0].click();
  rows[1].click();
  return [rows[0].dataset.id, rows[1].dataset.id];
});

await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  s.getElementById('delete').click();
});
const disabledBefore = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('cok').disabled
);
check('confirm is disabled before the count is typed', disabledBefore === true);

await inPanel(() => {
  const s = document.getElementById('cgb-host').shadowRoot;
  const input = s.getElementById('cinput');
  input.value = '2';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
const enabledAfter = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('cok').disabled
);
check('confirm enables once the count matches', enabledAfter === false);

await inPanel(() => document.getElementById('cgb-host').shadowRoot.getElementById('cok').click());
await page.waitForFunction(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('status').textContent.startsWith('Done:'),
  { timeout: 20000 }
);
const done = await inPanel(
  () => document.getElementById('cgb-host').shadowRoot.getElementById('status').textContent
);

const deletedIds = calls
  .filter((call) => call.method === 'DELETE')
  .map((call) => call.path.split('/').pop());

check('exactly two DELETE requests', deletedIds.length === 2, deletedIds.join(','));
check(
  'only the ticked IDs were deleted',
  deletedIds.length === 2 && ticked.every((id) => deletedIds.includes(id)),
  'ticked=' + ticked.join(',')
);
check('server total dropped by exactly 2', conversations.size === 6, 'remaining=' + conversations.size);
check('summary reports two deleted', done.includes('2 deleted'), done);
check('summary reconciles the total', done.includes('Δ2'), done);

const endpoints = new Set(calls.map((call) => call.method + ' ' + call.path));
check(
  'no unexpected endpoints',
  [...endpoints].every(
    (endpoint) =>
      endpoint === 'GET /' ||
      endpoint === 'GET /favicon.ico' ||
      endpoint === 'GET /api/auth/session' ||
      endpoint === 'GET /backend-api/conversations' ||
      endpoint.startsWith('DELETE /backend-api/conversation/id/')
  ),
  [...endpoints].join(' | ')
);

check(
  'delete requests carried no body',
  calls.filter((call) => call.method === 'DELETE').length === 2
);

await browser.close();
await app.close();

process.exit(finish() ? 0 : 1);
