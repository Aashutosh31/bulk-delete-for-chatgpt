/* Privacy guard: fails if the shipped source drifts from the documented promises. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const files = fs.readdirSync(SRC).filter((name) => name.endsWith('.js')).sort();

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok: Boolean(ok) });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : ''));
}

const source = Object.fromEntries(
  files.map((name) => [name, fs.readFileSync(path.join(SRC, name), 'utf8')])
);
const all = files.map((name) => source[name]).join('\n');

check('source files are present', files.length >= 4, files.join(', '));
check('source is not minified', !files.some((name) => source[name].split('\n').some((line) => line.length > 400)));
check('no source maps are shipped', !fs.readdirSync(SRC).some((name) => name.endsWith('.map')));

/* 1. Network destinations. */
const urls = [...all.matchAll(/https?:\/\/[^\s'"`)\]<>,;]+/g)].map((match) => match[0]);
const badUrls = urls.filter((url) => !/^https:\/\/chatgpt\.com(\/|$)/.test(url));
check('every URL is https://chatgpt.com', badUrls.length === 0, badUrls.join(', '));

check('no protocol-relative or bare remote URLs', !/["'`]\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(all));
check('no ws:// or wss://', !/wss?:\/\//i.test(all));
check('no fetch to a variable from storage', !/fetch\(\s*(?:saved|settings|stored|data)\./i.test(all));

/* 2. Dangerous primitives. */
const banned = [
  [/\beval\s*\(/, 'eval'],
  [/\bnew\s+Function\s*\(/, 'new Function'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bsendBeacon\b/, 'sendBeacon'],
  [/\bimportScripts\b/, 'importScripts'],
  [/\bdocument\.write\b/, 'document.write'],
  [/\bchrome\.tabs\b/, 'chrome.tabs'],
  [/\bbrowser\.tabs\b/, 'browser.tabs'],
  [/\bchrome\.cookies\b/, 'chrome.cookies'],
  [/\bbrowser\.cookies\b/, 'browser.cookies'],
  [/\bchrome\.webRequest\b/, 'chrome.webRequest'],
  [/\bchrome\.scripting\b/, 'chrome.scripting'],
  [/\bchrome\.management\b/, 'chrome.management'],
  [/\bchrome\.identity\b/, 'chrome.identity'],
  [/\bchrome\.runtime\.getURL\b/, 'chrome.runtime.getURL'],
];
for (const [pattern, label] of banned) {
  check('source avoids ' + label, !pattern.test(all), label);
}

/* 3. fetch lives in exactly one file. */
const fetchers = files.filter((name) => /\bfetch\s*\(/.test(source[name]));
check('fetch appears only in src/api.js', JSON.stringify(fetchers) === JSON.stringify(['api.js']), fetchers.join(', '));
check('fetch calls pass credentials', (source['api.js'].match(/fetch\(/g) || []).length === (source['api.js'].match(/credentials:\s*'include'/g) || []).length);

/* 4. innerHTML: one static skeleton, never interpolated. */
const innerHtmlTotal = (all.match(/\.innerHTML\s*=/g) || []).length;
check('exactly one innerHTML assignment', innerHtmlTotal === 1, String(innerHtmlTotal));

const panel = source['panel.js'];
const htmlMatch = panel.match(/\.innerHTML\s*=\s*`([\s\S]*?)`;/);
check('the innerHTML assignment uses a template literal', Boolean(htmlMatch));
if (htmlMatch) {
  check('the innerHTML template has no interpolation', !htmlMatch[1].includes('${'));
}
check('titles are rendered with textContent', /textContent\s*=/.test(panel));
check('no user data reaches innerHTML', !/innerHTML[^;]*\$\{/.test(all));

/* 5. No credential-shaped literals. */
check('no JWT in the source', !/eyJ[A-Za-z0-9_-]{10,}/.test(all));
check('no bearer token literal', !/Bearer\s+[A-Za-z0-9._-]{20,}/.test(all));
check('no session cookie literal', !/__Secure-next-auth\.session-token\s*=\s*\S{8,}/.test(all));
check('no long hex secrets', !/[A-Fa-f0-9]{40,}/.test(all));
check('no API key assignments', !/\b(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}/i.test(all));

/* 6. Storage payload limits. */
const lastRun = panel.match(/storageSet\('cgb\.lastRun',\s*\{([\s\S]*?)\}\);/);
check('cgb.lastRun payload exists', Boolean(lastRun));
if (lastRun) {
  check('cgb.lastRun stores no action log', !/\blog\b\s*:/.test(lastRun[1]));
  check('cgb.lastRun stores no titles', !/title/i.test(lastRun[1]));
  check('cgb.lastRun stores no conversation ids', !/\bid\s*:/i.test(lastRun[1]));
}
check('only the two documented storage keys are written', (() => {
  const keys = new Set([...all.matchAll(/storage(?:Set|Get|Remove)\(\s*\['?([^'\],)]+)/g)].map((m) => m[1].trim()));
  return [...keys].every((key) => key === 'cgb.settings' || key === 'cgb.lastRun');
})());

/* 7. Deletion is per-conversation and user-scoped. */
check('no bulk/delete-all endpoint', !/\/backend-api\/conversations\/[^'"`]*delete/i.test(all));
check('delete path keeps the /id/ segment', /conversation\/id\//.test(source['api.js']));
check('delete uses DELETE', /method:\s*'DELETE'/.test(source['api.js']));
check('no archive call', !/is_archived['"]?\s*[:=]\s*true[^;]*PATCH/i.test(all));
check('no aria/archive patch endpoint', !/PATCH/.test(all));

/* 8. No remote resources in the UI. */
check('no remote images in panel markup', !/<img\b/i.test(panel));
check('no external stylesheet links', !/<link\b/i.test(panel));
check('no @import in CSS', !/@import/.test(panel));
check('no inline event handler attributes', !/\son[a-z]+\s*=/i.test(htmlMatch ? htmlMatch[1] : ''));

/* 9. Session token is never persisted. */
check('token is not written to storage', !/storage(Set|Get)\(\s*['"](?:cgb\.)?token/i.test(all));
check('token is not logged', !/console\.(?:log|info|warn|error)\([^)]*\btoken\b/i.test(all));

const failed = results.filter((result) => !result.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
process.exit(failed.length === 0 ? 0 : 1);
