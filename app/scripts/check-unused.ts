/**
 * Verification script: confirms assumptions about unused/dead code before deletion.
 * Run with: npx tsx scripts/check-unused.ts
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const COMPONENTS_DIR = path.join(ROOT, 'components');
const LIB_DIR = path.join(ROOT, 'lib');

let passed = 0;
let failed = 0;

function collectFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? `\n         → ${detail}` : ''}`);
    failed++;
  }
}

const sourceFiles = [
  ...collectFiles(APP_DIR, ['.ts', '.tsx']),
  ...collectFiles(COMPONENTS_DIR, ['.ts', '.tsx']),
  ...collectFiles(LIB_DIR, ['.ts', '.tsx']),
];

// Exclude the file under test itself when checking self-references
function filesExcluding(exclude: string): string[] {
  return sourceFiles.filter((f) => !f.includes(exclude));
}

console.log('\n=== check-unused.ts ===\n');

// ─── 1. OnboardingTour is not imported anywhere ────────────────────────────
{
  const importers = filesExcluding('OnboardingTour').filter((f) => {
    const content = readFile(f);
    return content.includes('OnboardingTour') || content.includes('onboarding-tour');
  });
  check(
    'components/OnboardingTour.tsx — not imported in any source file',
    importers.length === 0,
    importers.length > 0 ? `Found in: ${importers.map((f) => path.relative(ROOT, f)).join(', ')}` : undefined,
  );
}

// ─── 2. /api/v1/saved-grants/stats is never called ───────────────────────
{
  // Exclude the route file itself (it contains the path in a comment)
  const callers = filesExcluding(path.join('saved-grants', 'stats')).filter((f) => {
    const content = readFile(f);
    return content.includes('saved-grants/stats') || content.includes('saved_grants/stats');
  });
  check(
    'app/api/v1/saved-grants/stats — never referenced in source',
    callers.length === 0,
    callers.length > 0 ? `Referenced in: ${callers.map((f) => path.relative(ROOT, f)).join(', ')}` : undefined,
  );
}

// ─── 3. axios is not imported anywhere ────────────────────────────────────
{
  const axiosUsers = sourceFiles.filter((f) => {
    const content = readFile(f);
    return /import\s+.*from\s+['"]axios['"]|require\s*\(\s*['"]axios['"]\s*\)/.test(content);
  });
  check(
    'axios — not imported in any source file',
    axiosUsers.length === 0,
    axiosUsers.length > 0 ? `Found in: ${axiosUsers.map((f) => path.relative(ROOT, f)).join(', ')}` : undefined,
  );
}

// ─── 4. OnboardingTour file exists (we haven't deleted it yet) ────────────
{
  const tourFile = path.join(COMPONENTS_DIR, 'OnboardingTour.tsx');
  check('components/OnboardingTour.tsx exists on disk (pre-deletion)', fs.existsSync(tourFile));
}

// ─── 5. saved-grants/stats route exists (pre-deletion) ───────────────────
{
  const statsRoute = path.join(APP_DIR, 'api', 'v1', 'saved-grants', 'stats', 'route.ts');
  check('app/api/v1/saved-grants/stats/route.ts exists on disk (pre-deletion)', fs.existsSync(statsRoute));
}

// ─── Summary ──────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  console.error('Some checks failed — review before deleting files.');
  process.exit(1);
} else {
  console.log('All checks passed — safe to proceed with deletion.');
}
