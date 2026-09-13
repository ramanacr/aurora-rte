import * as fs from 'node:fs';
import * as path from 'node:path';

export class BoundaryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoundaryError';
  }
}

/**
 * Extracts import and require specifiers from code.
 */
export function extractImports(code) {
  const specifiers = [];
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    specifiers.push(match[1] || match[2]);
  }
  return specifiers;
}

/**
 * Validates that file does not import any forbidden package prefix.
 */
export function checkImports(filePath, fileContent, forbiddenPrefixes) {
  const imports = extractImports(fileContent);
  for (const imp of imports) {
    for (const forbidden of forbiddenPrefixes) {
      if (imp === forbidden || imp.startsWith(forbidden + '/')) {
        throw new BoundaryError(
          `Forbidden import "${imp}" found in "${filePath}". Forbidden: ${forbidden}`
        );
      }
    }
  }
}

/**
 * Scans directories recursively for typescript/javascript files.
 */
function scanFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Enforces all architectural boundaries across the monorepo.
 */
export function checkAllBoundaries(baseDir = process.cwd()) {
  const violations = [];

  // Rule 1: @aurora/model cannot import any other @aurora package or prosemirror
  const modelFiles = scanFiles(path.join(baseDir, 'packages/model/src'));
  for (const f of modelFiles) {
    const code = fs.readFileSync(f, 'utf-8');
    try {
      checkImports(f, code, ['@aurora/editor', '@aurora/engine-prosemirror', '@aurora/features', '@aurora/ui', 'prosemirror']);
    } catch (err) {
      violations.push(err.message);
    }
  }

  // Rule 2: Consumers cannot import @aurora/engine-prosemirror directly (only editor can)
  const nonEngineFiles = [
    ...scanFiles(path.join(baseDir, 'packages/features/src')),
    ...scanFiles(path.join(baseDir, 'packages/ui/src')),
    ...scanFiles(path.join(baseDir, 'packages/web-component/src')),
    ...scanFiles(path.join(baseDir, 'packages/angular/src')),
    ...scanFiles(path.join(baseDir, 'packages/react/src')),
    ...scanFiles(path.join(baseDir, 'packages/extension-sdk/src'))
  ];
  for (const f of nonEngineFiles) {
    const code = fs.readFileSync(f, 'utf-8');
    try {
      checkImports(f, code, ['@aurora/engine-prosemirror', 'prosemirror-']);
    } catch (err) {
      violations.push(err.message);
    }
  }

  // Rule 3: Core packages must never import @aurora/enterprise-*
  const coreFiles = [
    ...scanFiles(path.join(baseDir, 'packages/model/src')),
    ...scanFiles(path.join(baseDir, 'packages/engine-prosemirror/src')),
    ...scanFiles(path.join(baseDir, 'packages/editor/src')),
    ...scanFiles(path.join(baseDir, 'packages/features/src')),
    ...scanFiles(path.join(baseDir, 'packages/ui/src')),
    ...scanFiles(path.join(baseDir, 'packages/extension-sdk/src'))
  ];
  for (const f of coreFiles) {
    const code = fs.readFileSync(f, 'utf-8');
    try {
      checkImports(f, code, ['@aurora/enterprise-', '@aurora/review-service', '@aurora/gateway']);
    } catch (err) {
      violations.push(err.message);
    }
  }

  if (violations.length > 0) {
    console.error('Boundary check violations:\n' + violations.join('\n'));
    return { valid: false, violations };
  }

  return { valid: true, violations: [] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const result = checkAllBoundaries();
  if (!result.valid) {
    process.exit(1);
  }
  console.log('All package boundaries verified successfully.');
}
