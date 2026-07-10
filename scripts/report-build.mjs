import fs from 'node:fs';
import path from 'node:path';

const buildMode = process.argv[2] || 'web';
const distDir = path.resolve(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    const stats = fs.statSync(fullPath);
    files.push({
      path: fullPath,
      relativePath: path.relative(distDir, fullPath),
      size: stats.size,
    });
  }

  return files;
}

const distFiles = walkFiles(distDir);
const assetFiles = walkFiles(assetsDir);
const totalSize = distFiles.reduce((sum, file) => sum + file.size, 0);
const topFiles = [...distFiles]
  .sort((left, right) => right.size - left.size)
  .slice(0, 10);

console.log(`Build report [${buildMode}]`);
console.log(`- dist files: ${distFiles.length}`);
console.log(`- asset files: ${assetFiles.length}`);
console.log(`- total dist size: ${formatBytes(totalSize)}`);
console.log('- largest files:');
topFiles.forEach((file) => {
  console.log(`  ${formatBytes(file.size).padStart(8)}  ${file.relativePath}`);
});
