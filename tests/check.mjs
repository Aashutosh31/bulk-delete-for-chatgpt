/* Manifest and packaging consistency checks. No browser needed. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

function check(name, ok, extra = '') {
  results.push({ name, ok: Boolean(ok) });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : ''));
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

const firefox = readJson('manifests/manifest.firefox.json');
const chrome = readJson('manifests/manifest.chrome.json');
const pkg = readJson('package.json');

check('both manifests parse as JSON', true);
check('manifest version is 3', firefox.manifest_version === 3 && chrome.manifest_version === 3);
check('manifest versions match package.json', firefox.version === pkg.version && chrome.version === pkg.version, pkg.version);
check('versions are numeric dotted', /^\d+(\.\d+){1,3}$/.test(pkg.version), pkg.version);
check('both targets share a name', firefox.name === chrome.name && firefox.name === 'Bulk Delete for ChatGPT');
check('description stays under 132 chars', chrome.description.length <= 132, String(chrome.description.length));
check('homepage points at the repo', firefox.homepage_url === pkg.homepage && chrome.homepage_url === pkg.homepage);

const WHITELIST = ['storage'];
check('only the storage permission', JSON.stringify(chrome.permissions) === JSON.stringify(WHITELIST) && JSON.stringify(firefox.permissions) === JSON.stringify(WHITELIST));
check('no optional permissions', !chrome.optional_permissions && !firefox.optional_permissions);
check('host access is chatgpt.com only', JSON.stringify(chrome.host_permissions) === JSON.stringify(['https://chatgpt.com/*']));
check('no background/service worker', !chrome.background && !firefox.background);
check('no web_accessible_resources', !chrome.web_accessible_resources && !firefox.web_accessible_resources);

for (const [label, manifest] of [['chrome', chrome], ['firefox', firefox]]) {
  const scripts = manifest.content_scripts || [];
  check(label + ': exactly one content script', scripts.length === 1);
  const entry = scripts[0] || {};
  check(label + ': matches chatgpt.com only', JSON.stringify(entry.matches) === JSON.stringify(['https://chatgpt.com/*']));
  const files = entry.js || [];
  check(
    label + ': scripts load util → api → panel → main',
    JSON.stringify(files) === JSON.stringify(['src/util.js', 'src/api.js', 'src/panel.js', 'src/main.js']),
    files.join(', ')
  );
  check(
    label + ': every script file exists',
    files.every((file) => fs.existsSync(path.join(ROOT, file)))
  );
  for (const [size, file] of Object.entries(manifest.icons || {})) {
    check(label + ': icon ' + size + ' exists', fs.existsSync(path.join(ROOT, file)), file);
  }
}

check('firefox declares a stable gecko id', firefox.browser_specific_settings?.gecko?.id === 'bulk-delete-for-chatgpt@aashutosh31.github.io');
check(
  'firefox min version supports data collection permissions',
  Number(firefox.browser_specific_settings?.gecko?.strict_min_version?.split('.')[0]) >= 140,
  firefox.browser_specific_settings?.gecko?.strict_min_version
);
check(
  'android min version supports data collection permissions',
  Number(firefox.browser_specific_settings?.gecko_android?.strict_min_version?.split('.')[0]) >= 142,
  firefox.browser_specific_settings?.gecko_android?.strict_min_version
);
check(
  'firefox declares no data collection',
  JSON.stringify(firefox.browser_specific_settings?.gecko?.data_collection_permissions) === JSON.stringify({ required: ['none'] })
);
check('chrome does not carry a gecko block', !chrome.browser_specific_settings);

check('license is MIT', pkg.license === 'MIT' && fs.existsSync(path.join(ROOT, 'LICENSE')));
check('LICENSE names the copyright holder', /Copyright \(c\) 2026 Aashutosh Bairagi/.test(fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8')));

for (const doc of ['README.md', 'HOW-TO-USE.md', 'PRIVACY.md', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'docs/PUBLISHING.md']) {
  check(doc + ' exists', fs.existsSync(path.join(ROOT, doc)));
}

check('build.sh is executable', Boolean(fs.statSync(path.join(ROOT, 'build.sh')).mode & 0o111));
check('package.json test script runs check and guard', /npm run check/.test(pkg.scripts.test) && /npm run guard/.test(pkg.scripts.test));

const failed = results.filter((result) => !result.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
process.exit(failed.length === 0 ? 0 : 1);
