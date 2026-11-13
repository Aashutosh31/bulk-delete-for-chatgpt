import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXT = path.join(ROOT, 'build', 'chrome');
export const CACHE = path.join(ROOT, 'tests', '.cache');
export const PORT = Number(process.env.TEST_PORT || 8443);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

export function chromePath() {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('Chrome/Chromium not found. Set CHROME_PATH to the binary.');
  }
  return found;
}

/* A throwaway self-signed cert for the fake chatgpt.com, generated on demand. */
export function ensureCert() {
  fs.mkdirSync(CACHE, { recursive: true });
  const key = path.join(CACHE, 'key.pem');
  const cert = path.join(CACHE, 'cert.pem');
  if (fs.existsSync(key) && fs.existsSync(cert)) return { key, cert };

  try {
    execFileSync(
      'openssl',
      [
        'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', key, '-out', cert, '-days', '1',
        '-subj', '/CN=chatgpt.com',
        '-addext', 'subjectAltName=DNS:chatgpt.com',
      ],
      { stdio: 'ignore' }
    );
  } catch {
    throw new Error('openssl is required to generate the test certificate.');
  }
  return { key, cert };
}

export async function launch() {
  if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
    throw new Error('build/chrome is missing. Run ./build.sh first.');
  }

  return puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    acceptInsecureCerts: true,
    args: [
      '--no-sandbox',
      '--ignore-certificate-errors',
      `--host-resolver-rules=MAP chatgpt.com 127.0.0.1:${PORT}`,
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
    ],
    defaultViewport: { width: 1200, height: 800 },
  });
}

export async function openApp(page) {
  await page.goto('https://chatgpt.com/', { waitUntil: 'networkidle2' });
  try {
    await page.waitForFunction(
      () => document.getElementById('cgb-host')?.shadowRoot?.getElementById('fab'),
      { timeout: 15000 }
    );
  } catch {
    throw new Error(
      'The extension did not load. Branded Chrome 137+ ignores --load-extension; ' +
        'point CHROME_PATH at Chromium or Chrome for Testing ' +
        '(npx @puppeteer/browsers install chrome@stable).'
    );
  }
}

/* Runs a function with the panel's shadow root as `s`. */
export function panel(page, fn, ...args) {
  return page.evaluate(fn, ...args);
}

export function reporter() {
  const results = [];
  return {
    check(name, ok, extra = '') {
      results.push({ name, ok: Boolean(ok) });
      console.log(
        (ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : '')
      );
    },
    finish() {
      const failed = results.filter((result) => !result.ok);
      console.log(
        '\n' + (results.length - failed.length) + '/' + results.length + ' checks passed'
      );
      return failed.length === 0;
    },
  };
}
