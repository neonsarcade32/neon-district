'use strict';

// Static inventory for the Cork7 offline-readiness audit.
// This intentionally does not download or rewrite third-party assets.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const roots = ['cork7.html', 'cork7-bridge.js', 'cork7-assets'];
const files = [];

function walk(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(path.join(target, entry.name));
    else if (entry.isFile()) files.push(path.join(target, entry.name));
  }
}

for (const item of roots) walk(path.join(root, item));

const external = new Map();
const missingLocal = [];
const extPattern = /https?:\\/\\/[^\\s"'<>\\`)]*/g;
const localPattern = /(?:src|href)=["']([^"']+)["']/g;

for (const file of files) {
  let source;
  try { source = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const relative = path.relative(root, file).replaceAll(path.sep, '/');

  for (const match of source.matchAll(extPattern)) {
    const raw = match[0].replace(/[;,]+$/, '');
    let url;
    try { url = new URL(raw); } catch { continue; }
    if (url.hostname === 'neonsarcade32.github.io') continue;
    const key = url.origin;
    if (!external.has(key)) external.set(key, new Set());
    external.get(key).add(relative + ' -> ' + url.pathname + url.search);
  }

  if (relative === 'cork7.html') {
    for (const match of source.matchAll(localPattern)) {
      const value = match[1];
      if (/^(?:data:|https?:|#|\\/\\/)/i.test(value)) continue;
      const pathname = value.split(/[?#]/)[0];
      if (!pathname) continue;
      const resolved = path.resolve(root, pathname);
      if (!resolved.startsWith(root + path.sep) && resolved !== root) continue;
      if (!fs.existsSync(resolved)) missingLocal.push(value);
    }
  }
}

console.log('Cork7 offline readiness — static inventory only');
console.log('Files inspected: ' + files.length);
console.log('This audit does not prove that dynamic runtime requests are covered.');
console.log('');
console.log('External origins referenced by inspected files:');
if (!external.size) console.log('  none detected');
for (const [origin, refs] of [...external.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log('\n' + origin + ' (' + refs.size + ' references)');
  for (const ref of [...refs].slice(0, 12)) console.log('  - ' + ref);
  if (refs.size > 12) console.log('  ... and ' + (refs.size - 12) + ' more');
}
console.log('');
console.log('Missing local src/href references in cork7.html:');
if (!missingLocal.length) console.log('  none detected');
else for (const item of [...new Set(missingLocal)]) console.log('  - ' + item);
console.log('');
console.log('Next required step: compare this inventory with a real solo-run network log,');
console.log('then only cache assets that are necessary and authorized for offline use.');
