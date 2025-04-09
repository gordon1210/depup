import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import yaml from 'yaml';

import type { PackageInfo } from './types.js';

export function getDisplayVersion(pkg: PackageInfo): string | undefined {
  if (pkg.targetVersionType === 'patch') {
    return pkg.patchVersion ? `~${pkg.patchVersion}` : undefined;
  }
  if (pkg.targetVersionType === 'minor') {
    return pkg.minorVersion ? `^${pkg.minorVersion}` : undefined;
  }
  if (pkg.targetVersionType === 'latest') {
    return !semver.prerelease(pkg.latestVersion)
      ? pkg.latestVersion
      : undefined;
  }
  if (pkg.targetVersionType === 'prerelease') {
    return pkg.prereleaseVersion;
  }
  return undefined;
}

export async function detectWorkspaces(root: string): Promise<string[]> {
  const pkgJsonPath = path.join(root, 'package.json');
  const workspaceYamlPath = path.join(root, 'pnpm-workspace.yaml');
  try {
    const yamlExists = await fs
      .stat(workspaceYamlPath)
      .then(() => true)
      .catch(() => false);
    if (yamlExists) {
      const raw = await fs.readFile(workspaceYamlPath, 'utf8');
      const parsed = yaml.parse(raw);
      return parsed.packages || [];
    } else {
      const content = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
      if (content.workspaces) {
        if (Array.isArray(content.workspaces)) {
          return content.workspaces;
        }
        if (content.workspaces.packages) {
          return content.workspaces.packages;
        }
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function progressBar(current: number, total: number, width = 20): string {
  const percent = total > 0 ? current / total : 0;
  const filled = Math.round(percent * width);
  return '▌' + '█'.repeat(filled) + '░'.repeat(width - filled) + `▐ ${current}/${total}`;
}
