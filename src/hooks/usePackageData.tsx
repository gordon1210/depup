import { execSync } from "child_process";
import fs from "fs/promises";
import { globby } from "globby";
import pLimit from "p-limit";
import packageJson from "package-json";
import path from "path";
import { useEffect, useState } from "react";
import semver from "semver";

import type { PackageInfo, PackageJsonUpdate } from "../types.js";
import { detectWorkspaces, getDisplayVersion } from "../utils.js";

const PACKAGE_BATCH_SIZE = 3

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
                { cwd: root, absolute: true },
              )
            : [path.join(root, "package.json")];

        // const pkgs: PackageInfo[] = [];
        // Create a concurrency limit with a lower number to prevent rate limiting
        const limit = pLimit(5);
        const tasks: Array<() => Promise<void>> = [];

        for (const pkgPath of packageJsonPaths) {
          tasks.push(() => processPackageJson(pkgPath, setPackages, limit));
        }

        // Process package.json files in small batches to avoid race conditions
        for (let i = 0; i < tasks.length; i += PACKAGE_BATCH_SIZE) {
          await Promise.all(tasks.slice(i, i + PACKAGE_BATCH_SIZE).map((task) => task()));
        }

        //setPackages(pkgs);
        setLoading(false);
      } catch (error) {
        console.error("Error scanning dependencies:", error);
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

    switch (pkg.targetVersionType) {
      case "patch":
        version = pkg.patchVersion;
        break;
      case "minor":
        version = pkg.minorVersion;
        break;
      case "latest":
        version = !semver.prerelease(pkg.latestVersion)
          ? pkg.latestVersion
          : undefined;
        break;
      case "prerelease":
        version = pkg.prereleaseVersion;
        break;
    }

    // If the selected version type doesn't have a value, implement a fallback strategy
    if (!version) {
      // Try in order: patch -> minor -> latest -> prerelease
      version =
        pkg.patchVersion ||
        pkg.minorVersion ||
        (!semver.prerelease(pkg.latestVersion)
          ? pkg.latestVersion
          : undefined) ||
        pkg.prereleaseVersion;

      // If we found a fallback version, log it
      if (version) {
        console.warn(
          `No ${pkg.targetVersionType} version available for ${pkg.name}. ` +
            `Falling back to ${version}.`,
        );
      }
    }

    return version;
  };

  const updateDependencies = async (toUpdate: PackageInfo[]): Promise<void> => {
    const updates: Map<string, PackageJsonUpdate> = new Map();

    // First pass: collect all updates to make
    for (const pkg of toUpdate) {
      const relPath = path.relative(process.cwd(), pkg.packagePath);
      const displayVersion = getDisplayVersion(pkg);

      // Skip if we don't have a valid display version
      if (!displayVersion) {
        console.warn(
          `Skipping ${pkg.name}: Unable to determine display version.`,
        );
        continue;
      }

      const installVersion = getInstallVersion(pkg);

      // Skip if we don't have a valid installation version
      if (!installVersion) {
        console.warn(
          `Skipping ${pkg.name}: Unable to determine installation version.`,
        );
        continue;
      }

      // Skip if current version is the same as target version
      const currentSemver =
        semver.valid(semver.coerce(pkg.currentVersion)) || pkg.currentVersion;
      const targetSemver =
        semver.valid(semver.coerce(installVersion)) || installVersion;

      if (
        currentSemver === targetSemver ||
        semver.eq(currentSemver, targetSemver)
      ) {
        console.log(
          `\nSkipping ${pkg.name} in ${relPath || "."}: Already at version ${currentSemver}`,
        );
        continue;
      }

      // Save this update for the specific package.json file
      if (!updates.has(pkg.packageJsonPath)) {
        updates.set(pkg.packageJsonPath, {
          path: pkg.packageJsonPath,
          directory: pkg.packagePath,
          changes: [],
        });
      }

      // Add this package to the list of updates for this package.json
      updates.get(pkg.packageJsonPath)?.changes.push({
        name: pkg.name,
        currentVersion: pkg.currentVersion,
        newVersion: installVersion,
        displayVersion: displayVersion,
      });
    }

    // If there are no valid updates, return early
    if (updates.size === 0) {
      console.log("No updates to apply.");
      return;
    }

    // Now apply all updates at once
    for (const update of updates.values()) {
      try {
        // Read the package.json file
        const packageJsonContent = JSON.parse(
          await fs.readFile(update.path, "utf8"),
        );

        // Apply all changes to this package.json
        let didModify = false;
        for (const change of update.changes) {
          const relPath = path.relative(process.cwd(), update.directory);
          console.log(
            `\nUpdating ${change.name} in ${relPath || "."} to ${change.displayVersion}`,
          );

          // Update in dependencies or devDependencies as appropriate, preserving prefix
          if (packageJsonContent.dependencies?.[change.name]) {
            // Get the original version string to preserve prefix
            const originalVersion =
              packageJsonContent.dependencies[change.name];
            // Extract the prefix properly - handles ^, ~, >=, <=, >, <, =, etc.
            const versionNumber =
              semver.valid(semver.coerce(originalVersion)) || "";
            const prefix = versionNumber
              ? originalVersion.substring(
                  0,
                  originalVersion.indexOf(versionNumber),
                )
              : "";

            // Apply the same prefix to the new version
            packageJsonContent.dependencies[change.name] =
              `${prefix}${change.newVersion}`;
            didModify = true;
          }
          if (packageJsonContent.devDependencies?.[change.name]) {
            // Get the original version string to preserve prefix
            const originalVersion =
              packageJsonContent.devDependencies[change.name];
            // Extract the prefix properly - handles ^, ~, >=, <=, >, <, =, etc.
            const versionNumber =
              semver.valid(semver.coerce(originalVersion)) || "";
            const prefix = versionNumber
              ? originalVersion.substring(
                  0,
                  originalVersion.indexOf(versionNumber),
                )
              : "";

            // Apply the same prefix to the new version
            packageJsonContent.devDependencies[change.name] =
              `${prefix}${change.newVersion}`;
            didModify = true;
          }
        }

        if (didModify) {
          // Write the updated package.json back to disk
          await fs.writeFile(
            update.path,
            JSON.stringify(packageJsonContent, null, 2) + "\n",
            "utf8",
          );
        }
      } catch (error) {
        console.error(`Error updating ${update.path}:`, error);
      }
    }

    // Run a single pnpm install command at the end
    console.log("\nRunning pnpm install to update all dependencies...");
    execSync("pnpm install", { stdio: "inherit" });
    console.log("\nDependencies updated successfully!");
  };

  return { packages, loading, error, updatePackages, updateDependencies };
}

async function processPackageJson(
  pkgPath: string,
  setPackages: React.Dispatch<React.SetStateAction<PackageInfo[]>>,
  limit: ReturnType<typeof pLimit>,
): Promise<void> {
  try {
    const content = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    const deps = Object.assign(
      {},
      content.dependencies,
      content.devDependencies,
    );

    const depTasks = Object.entries(deps).map(([dep, version]) =>
      processDependency(dep, version as string, pkgPath, setPackages, limit),
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
  setPackages: React.Dispatch<React.SetStateAction<PackageInfo[]>>,
  limit: ReturnType<typeof pLimit>,
): Promise<void> {
  try {
    const current = semver.minVersion(version);
    if (!current) {
      return;
    }

    const pkgMeta = await limit(() =>
      packageJson(dep, { allVersions: true }).catch(() => null),
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
      if (!patch && semver.diff(current, v) === "patch") {
        patch = v;
        continue;
      }
      if (!minor && semver.diff(current, v) === "minor") {
        minor = v;
        continue;
      }
    }

    const latest = stableVersions.at(-1);

    if (!(patch || minor || prerelease || latest)) {
      return;
    }

    const displayVersion =
      getDisplayVersion({
        name: dep,
        currentVersion: version,
        latestVersion: latest!,
        patchVersion: patch,
        minorVersion: minor || patch,
        displayVersion: "",
        packagePath: "",
        packageJsonPath: "",
        selected: false,
        disabled: false,
        targetVersionType: "patch",
        prereleaseVersion: prerelease,
      }) || version;

    setPackages((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(
        (p) => p.name === dep && p.packagePath === path.dirname(pkgPath),
      );

      if (index !== -1) {
        updated[index] = {
          ...updated[index],
          latestVersion: latest!,
          patchVersion: patch,
          minorVersion: minor || patch,
          displayVersion,
          targetVersionType: "patch",
          lastTargetVersionType: "patch",
        };
        return updated;
      }

      return [
        ...updated,
        {
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
          targetVersionType: "patch",
          prereleaseVersion: prerelease,
          lastTargetVersionType: "patch",
        },
      ];
    });
    // pkgs.push({
    //   name: dep,
    //   currentVersion: version,
    //   latestVersion: latest!,
    //   patchVersion: patch,
    //   minorVersion: minor || patch,
    //   displayVersion,
    //   packagePath: path.dirname(pkgPath),
    //   packageJsonPath: pkgPath,
    //   selected: false,
    //   disabled: false,
    //   targetVersionType: "patch",
    //   prereleaseVersion: prerelease,
    //   lastTargetVersionType: "patch",
    // });
  } catch (error) {
    // Skip this dependency if there's an error
    // no console.error when error is "TypeError: Invalid comparator: workspace"
    if ((error as Error).message.includes("Invalid comparator: workspace")) {
      return;
    }
    console.error(`Error processing ${dep}:`, error);
  }
}
