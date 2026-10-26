import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Real companies must never appear in sample data: the demo is shareable and must not imply real business ties. */
const REAL_COMPANIES = /\b(Tesla|Toyota|BMW|Bosch|Siemens|Cummins|Mercedes|Daimler|Tata|Thermax|Bridgestone|Kirloskar|Ashok Leyland|Larsen & Toubro|L&T|Atlas Copco|Bajaj|Ford Motor|MRF|Michelin|Goodyear|Apollo Tyres|Mahindra|Maruti|Hyundai)\b/i;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('sample data uses fictional organizations only', () => {
  const offenders: string[] = [];
  for (const file of [...sources('apps/web/src'), ...sources('packages/ui/src')]) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const m = line.match(REAL_COMPANIES);
        if (m) offenders.push(`${file}:${i + 1} ${m[0]}`);
      });
  }
  assert.deepEqual(offenders, []);
});
