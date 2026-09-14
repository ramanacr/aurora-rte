import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Industry-Standard Automated Semantic Versioning and Multi-Target Synchronization
 * Complies with SemVer 2.0.0, Conventional Commits, and Multi-Target Release Protocols.
 */

const ROOT_DIR = process.cwd();

// All manifests to keep strictly synchronized
const MANIFEST_PATHS = [
  'package.json',
  'packages/model/package.json',
  'packages/engine-prosemirror/package.json',
  'packages/editor/package.json',
  'packages/features/package.json',
  'packages/ui/package.json',
  'packages/extension-sdk/package.json',
  'packages/web-component/package.json',
  'packages/angular/package.json',
  'packages/react/package.json',
  'packages/enterprise-review/package.json',
  'apps/playground/package.json'
];

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getCommitsSince(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const log = execSync(`git log ${range} --pretty=format:"%s"`, { encoding: 'utf8' });
    return log.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Determines the next SemVer bump based on conventional commits:
 * - Breaking changes (BREAKING CHANGE: or type!:) -> major
 * - Features (feat:) -> minor
 * - Fixes & others (fix:, perf:, refactor:) -> patch
 */
export function determineBump(commits) {
  let bump = 'patch';

  for (const msg of commits) {
    if (msg.includes('BREAKING CHANGE:') || /^[a-z]+(\([a-z0-9_-]+\))?!:/.test(msg)) {
      return 'major';
    }
    if (/^feat(\([a-z0-9_-]+\))?:/.test(msg)) {
      bump = 'minor';
    }
  }

  return bump;
}

export function incrementVersion(currentVersion, bumpType) {
  const parts = currentVersion.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid SemVer: ${currentVersion}`);
  }

  let [major, minor, patch] = parts;

  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

export function syncAllManifests(newVersion) {
  const updated = [];

  for (const relPath of MANIFEST_PATHS) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    json.version = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    updated.push(relPath);
  }

  return updated;
}

export function updateChangelog(newVersion, commits) {
  const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
  const dateStr = new Date().toISOString().split('T')[0];

  const features = [];
  const fixes = [];
  const others = [];

  for (const msg of commits) {
    if (/^feat/i.test(msg)) features.push(msg);
    else if (/^fix/i.test(msg)) fixes.push(msg);
    else others.push(msg);
  }

  let section = `\n## [${newVersion}] - ${dateStr}\n\n`;
  if (features.length > 0) {
    section += `### 🚀 Features\n${features.map((m) => `- ${m}`).join('\n')}\n\n`;
  }
  if (fixes.length > 0) {
    section += `### 🐛 Bug Fixes & Improvements\n${fixes.map((m) => `- ${m}`).join('\n')}\n\n`;
  }
  if (others.length > 0) {
    section += `### 🔧 Maintenance & Documentation\n${others.map((m) => `- ${m}`).join('\n')}\n\n`;
  }

  const existing = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '# Changelog\n\nAll notable changes to Aurora RTE are documented in this file.\n';
  const updated = existing.replace('# Changelog\n\n', `# Changelog\n\n${section}`);
  fs.writeFileSync(changelogPath, updated, 'utf8');
}

// CLI Execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const currentVersion = rootPkg.version;
  const latestTag = getLatestTag();
  const commits = getCommitsSince(latestTag);

  // Allow explicit bump argument: --bump=patch|minor|major
  const explicitArg = process.argv.find((a) => a.startsWith('--bump='));
  const bumpType = explicitArg ? explicitArg.split('=')[1] : determineBump(commits);
  const isDryRun = process.argv.includes('--dry-run');

  const nextVersion = incrementVersion(currentVersion, bumpType);
  console.log(`Current version: ${currentVersion}`);
  console.log(`Latest git tag:  ${latestTag || '(none)'}`);
  console.log(`Detected bump:   ${bumpType} (${commits.length} commits analyzed)`);
  console.log(`Target version:  ${nextVersion}`);

  if (isDryRun) {
    console.log(`\n[DRY RUN] Would synchronize 12 manifests to v${nextVersion}`);
    console.log(`[DRY RUN] Would update CHANGELOG.md`);
  } else {
    const updatedFiles = syncAllManifests(nextVersion);
    console.log(`\nSynchronized ${updatedFiles.length} manifests to v${nextVersion}:`);
    updatedFiles.forEach((f) => console.log(`  ✓ ${f}`));

    updateChangelog(nextVersion, commits.length > 0 ? commits : ['chore: automated release version sync']);
    console.log('  ✓ CHANGELOG.md updated');
  }
}
