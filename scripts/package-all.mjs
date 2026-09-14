import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { execSync } from 'node:child_process';

/**
 * Aurora RTE Production-Grade Release Packaging Pipeline
 * Enforces:
 * 1. Multi-target compilation & verification
 * 2. Lean staging & artifact hygiene
 * 3. Tarball packaging with pnpm publishConfig resolution
 * 4. Dual distribution: standard ESM tarballs + standalone CDN bundle
 * 5. Cryptographic SHA-256 integrity generation for every release binary
 */

const ROOT_DIR = process.cwd();
const RELEASE_DIR = path.join(ROOT_DIR, 'release-artifacts');

const PUBLIC_PACKAGES = [
  '@aurora/model',
  '@aurora/editor',
  '@aurora/features',
  '@aurora/ui',
  '@aurora/extension-sdk',
  '@aurora/web-component',
  '@aurora/angular',
  '@aurora/react',
  '@aurora/enterprise-review'
];

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function runPackaging() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AURORA RTE PRODUCTION RELEASE & PACKAGING PIPELINE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Clean staging directory
  if (fs.existsSync(RELEASE_DIR)) {
    fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  console.log('✓ Initialized clean staging directory: release-artifacts/\n');

  // 2. TypeScript compilation
  console.log('⚙ Compiling monorepo packages (tsc --build)...');
  execSync('pnpm run typecheck', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('✓ Monorepo compilation verified.\n');

  // 3. Build standalone CDN bundle for Web Component
  console.log('⚙ Building standalone CDN bundle for @aurora/web-component...');
  execSync('npx vite build', { stdio: 'inherit', cwd: path.join(ROOT_DIR, 'packages/web-component') });
  const cdnBundleSrc = path.join(ROOT_DIR, 'packages/web-component/dist/bundle/aurora-editor.min.js');
  if (fs.existsSync(cdnBundleSrc)) {
    const cdnDest = path.join(RELEASE_DIR, 'aurora-editor.min.js');
    fs.copyFileSync(cdnBundleSrc, cdnDest);
    console.log('✓ Packaged standalone CDN bundle: release-artifacts/aurora-editor.min.js\n');
  }

  // 4. Pack every distribution package into .tgz
  console.log('⚙ Packaging distribution tarballs via pnpm pack...');
  for (const pkg of PUBLIC_PACKAGES) {
    process.stdout.write(`  Packaging ${pkg}... `);
    execSync(`pnpm --filter ${pkg} pack --pack-destination ${RELEASE_DIR}`, {
      stdio: 'pipe',
      cwd: ROOT_DIR
    });
    console.log('✓');
  }
  console.log('\n✓ All distribution packages packed successfully.\n');

  // 5. Generate SHA-256 checksums and manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    artifacts: []
  };

  const files = fs.readdirSync(RELEASE_DIR).filter((f) => !f.endsWith('.sha256') && !f.endsWith('.json'));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RELEASE ARTIFACTS & SHA-256 CHECKSUM MANIFEST');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const file of files) {
    const fullPath = path.join(RELEASE_DIR, file);
    const stat = fs.statSync(fullPath);
    const hash = sha256File(fullPath);

    // Write .sha256 file
    fs.writeFileSync(`${fullPath}.sha256`, `${hash}  ${file}\n`, 'utf8');

    manifest.artifacts.push({
      file,
      sizeBytes: stat.size,
      sizeFormatted: formatBytes(stat.size),
      sha256: hash
    });

    console.log(`\n📦 ${file}`);
    console.log(`   Size:   ${formatBytes(stat.size)}`);
    console.log(`   SHA256: ${hash}`);
  }

  fs.writeFileSync(
    path.join(RELEASE_DIR, 'release-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✓ Packaging complete! ${manifest.artifacts.length} release assets staged with SHA-256 checksums.`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runPackaging().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
