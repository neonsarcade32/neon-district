import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const scriptMatch = html.match(/<script>([\\s\\S]*?)<\\/script>/);
assert.ok(scriptMatch, 'inline game script exists');
new vm.Script(scriptMatch[1], { filename: 'pocket-hockey-inline.js' });

const checks = [
  ['source-transformed rink bounds', /rink=\\{x:300,y:0,w:500,h:900\\}/],
  ['source-transformed center circle', /ctx\\.arc\\(550,450,100/],
  ['puck starts at transformed source position', /puck=\\{x:550,y:450/],
  ['player 1 starts at transformed source position', /homeY:675/],
  ['player 2 starts at transformed source position', /homeY:225/],
  ['arrow key controls', /ArrowLeft.*ArrowRight.*ArrowUp.*ArrowDown/s],
  ['WASD controls', /keys\\.has\\('a'\\).*keys\\.has\\('d'\\).*keys\\.has\\('w'\\).*keys\\.has\\('s'\\)/s],
  ['P starts, pauses, and replays', /if\\(k==='p'\\)/],
  ['top goal awards player 1', /finishGoal\\(1\\)/],
  ['bottom goal awards player 2', /finishGoal\\(2\\)/],
  ['touch pointer input', /pointerdown/],
  ['pause, resume, restart and title controls', /getElementById\\('pause'\\).*getElementById\\('resume'\\).*getElementById\\('restart'\\).*getElementById\\('exit'\\)/s],
];
for (const [label, pattern] of checks) {
  assert.match(html, pattern, label);
  console.log('PASS', label);
}
assert.doesNotMatch(html, /serviceWorker\\.register/, 'no offline/service-worker behavior added');
console.log('PASS inline JavaScript parses; ' + checks.length + ' static behavior checks passed.');
