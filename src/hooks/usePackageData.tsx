import { execSync } from 'child_process';
import fs from 'fs/promises';
import { globby } from 'globby';
import pLimit from 'p-limit';
import packageJson from 'package-json';
import path from 'path';
import { useEffect, useState } from 'react';
import semver from 'semver';

import type { PackageInfo } from '../types.js';
import { detectWorkspaces, getDisplayVersion } from '../utils.js';

export function usePackageData() {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const root = process.cwd();
        const workspaces = await detectWorkspaces(root);
        const packageJsonPaths =
          workspaces.length > 0
            ? await globby(
                workspaces.map((ws) => `${ws}/package.json`),
                { cwd: root, absolute: true }
              )
            : [path.join(root, 'package.json')];

        const pkgs: PackageInfo[] = [];
        // Create a concurrency limit with a lower number to prevent rate limiting
        const limit = pLimit(5);
        const tasks: Promise<void>[] = [];

        for (const pkgPath of packageJsonPaths) {
          tasks.push(processPackageJson(pkgPath, pkgs, limit));
        }

        // Process package.json files sequentially to avoid race conditions
        for (let i = 0; i < tasks.length; i += 3) {
          await Promise.all(tasks.slice(i, i + 3));
        }

        setPackages(pkgs);
        setLoading(false);
      } catch (error) {
        console.error('Error scanning dependencies:', error);
        setError(error as Error);
        setLoading(false);
      }
    })();

    // Add a safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 120000); // 2 minute timeout

    return () => clearTimeout(timeoutId);
  }, []);

  const updatePackages = (updatedPackages: PackageInfo[]) => {
    setPackages(updatedPackages);
  };

  // Helper function to get clean version without prefixes for installation
  const getInstallVersion = (pkg: PackageInfo): string | undefined => {
    // First try the selected version type
    let version: string | undefined;
    
    switch(pkg.targetVersionType) {
      case 'patch':
        version = pkg.patchVersion;
        break;
      case 'minor':
        version = pkg.minorVersion;
        break;
      case 'latest':
        version = !semver.prerelease(pkg.latestVersion) 
          ? pkg.latestVersion 
          : undefined;
        break;
      case 'prerelease':
        version = pkg.prereleaseVersion;
        break;
    }
    
    // If the selected version type doesn't have a value, implement a fallback strategy
    if (!version) {
      // Try in order: patch -> minor -> latest -> prerelease
      version = pkg.patchVersion || 
                pkg.minorVersion || 
                (!semver.prerelease(pkg.latestVersion) ? pkg.latestVersion : undefined) || 
                pkg.prereleaseVersion;
      
      // If we found a fallback version, log it
      if (version) {
        console.warn(
          `No ${pkg.targetVersionType} version available for ${pkg.name}. ` +
          `Falling back to ${version}.`
        );
      }
    }
    
    return version;
  };

  const updateDependencies = (toUpdate: PackageInfo[]) => {
    for (const pkg of toUpdate) {
      const relPath = path.relative(process.cwd(), pkg.packagePath);
      const displayVersion = getDisplayVersion(pkg);
      const installVersion = getInstallVersion(pkg);
      
      if (!installVersion) {
        console.warn(
          `Skipping ${pkg.name}: Unable to determine installation version.`
        );
        continue; // Skip this package if we don't have a valid version
      }
      
      console.log(
        `\nUpdating ${pkg.name} in ${relPath || '.'} to ${displayVersion}`
      );
      
      execSync(
        `pnpm --filter ./${relPath || '.'} add ${pkg.name}@${installVersion}`,
        { stdio: 'inherit' }
      );
    }
  };

  return { packages, loading, error, updatePackages, updateDependencies };
}

async function processPackageJson(
  pkgPath: string,
  pkgs: PackageInfo[],
  limit: ReturnType<typeof pLimit>
): Promise<void> {
  try {
    const content = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const deps = Object.assign(
      {},
      content.dependencies,
      content.devDependencies
    );

    const depTasks = Object.entries(deps).map(([dep, version]) =>
      processDependency(dep, version as string, pkgPath, pkgs, limit)
    );

    // Process dependencies in batches to avoid overwhelming the Promise queue
    for (let i = 0; i < depTasks.length; i += 10) {
      await Promise.all(depTasks.slice(i, i + 10));
    }
  } catch (error) {
    // Skip invalid package.json
    console.error(`Error reading ${pkgPath}:`, error);
  }
}

async function processDependency(
  dep: string,
  version: string,
  pkgPath: string,
  pkgs: PackageInfo[],
  limit: ReturnType<typeof pLimit>
): Promise<void> {
  try {
    const current = semver.minVersion(version);
    if (!current) {
      return;
    }

    const pkgMeta = await limit(() =>
      packageJson(dep, { allVersions: true }).catch(() => null)
    );

    if (!pkgMeta) {
      return;
    }

    const all = Object.keys(pkgMeta.versions)
      .filter((v) => semver.valid(v) && semver.gt(v, current))
      .sort(semver.compare);

    const stableVersions = all.filter((v) => !semver.prerelease(v));
    const prerelease = all.find((v) => semver.prerelease(v));

    let patch: string | undefined;
    let minor: string | undefined;

    for (const v of stableVersions) {
      if (!patch && semver.diff(current, v) === 'patch') {
        patch = v;
        continue;
      }
      if (!minor && semver.diff(current, v) === 'minor') {
        minor = v;
        continue;
      }
    }

    const latest = stableVersions.at(-1);

    if (!(patch || minor || prerelease || latest)) {
      return;
    }

    const displayVersion = getDisplayVersion({
      name: dep,
      currentVersion: version,
      latestVersion: latest!,
      patchVersion: patch,
      minorVersion: minor || patch,
      displayVersion: '',
      packagePath: '',
      packageJsonPath: '',
      selected: false,
      disabled: false,
      targetVersionType: 'patch',
      prereleaseVersion: prerelease,
    }) || version;

    pkgs.push({
      name: dep,
      currentVersion: version,
      latestVersion: latest!,
      patchVersion: patch,
      minorVersion: minor || patch,
      displayVersion,
      packagePath: path.dirname(pkgPath),
      packageJsonPath: pkgPath,
      selected: false,
      disabled: false,
      targetVersionType: 'patch',
      prereleaseVersion: prerelease,
      lastTargetVersionType: 'patch',
    });
  } catch (error) {
    // Skip this dependency if there's an error
    // no console.error when error is "TypeError: Invalid comparator: workspace"
    if (
      (error as Error).message.includes('Invalid comparator: workspace')
    ) {
      return;
    }
    console.error(`Error processing ${dep}:`, error);
  }
}
