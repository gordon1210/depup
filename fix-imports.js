#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

// Extensions that should be processed
const extensions = ['.ts', '.tsx'];

// Find TypeScript files
async function findFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? findFiles(entryPath) : entryPath;
  }));
  
  return files.flat().filter(file => {
    const ext = path.extname(file);
    return extensions.includes(ext);
  });
}

// Fix imports in a file
async function fixImports(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Regular expression to match import statements
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  
  let updatedContent = content.replace(importRegex, (match, importPath) => {
    // Skip imports that already have extensions or are not local imports
    if (importPath.startsWith('.') && !importPath.match(/\.(js|jsx|ts|tsx)$/)) {
      return `from '${importPath}.js'`;
    }
    return match;
  });
  
  // Also update dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  updatedContent = updatedContent.replace(dynamicImportRegex, (match, importPath) => {
    if (importPath.startsWith('.') && !importPath.match(/\.(js|jsx|ts|tsx)$/)) {
      return `import('${importPath}.js')`;
    }
    return match;
  });
  
  await fs.writeFile(filePath, updatedContent, 'utf8');
  console.log(`Updated: ${filePath}`);
}

async function main() {
  console.log('Finding TypeScript files...');
  const files = await findFiles(srcDir);
  console.log(`Found ${files.length} files to process`);
  
  for (const file of files) {
    await fixImports(file);
  }
  
  console.log('All files processed successfully');
}

main().catch(console.error);
