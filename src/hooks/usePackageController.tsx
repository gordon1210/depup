import { useMemo, useState } from "react";
import semver from "semver";

import type { PackageGroup, PackageInfo } from "../types.js";
import { getDisplayVersion } from "../utils.js";

export function usePackageController(packages: PackageInfo[]) {
  const [cursor, setCursor] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);

  const grouped = useMemo(() => {
    const groups: Record<string, PackageInfo[]> = {};
    for (const p of packages) {
      const key = p.packagePath;
      groups[key] ||= [];
      groups[key].push(p);
    }

    const entries = Object.entries(groups).map(
      ([path, packages]): PackageGroup => ({ path, packages }),
    );

    const isMonorepo = entries.length > 1;

    if (isMonorepo) {
      const sharedMap = new Map<string, PackageInfo[]>();
      for (const pkg of packages) {
        sharedMap.set(pkg.name, [...(sharedMap.get(pkg.name) || []), pkg]);
      }
      const sharedPackages = Array.from(sharedMap.entries())
        .filter(([, pkgs]) => pkgs.length > 1)
        .map(([, pkgs]) => pkgs)
        .flat();

      if (sharedPackages.length > 0) {
        entries.push({ path: "__SHARED__", packages: sharedPackages });
      }
    }

    return entries;
  }, [packages]);

  const currentGroup = grouped[tabIndex] || { path: "", packages: [] };

  const handleTabChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setTabIndex((prev) => Math.max(0, prev - 1));
    } else {
      setTabIndex((prev) => Math.min(grouped.length - 1, prev + 1));
    }
    setCursor(0);
  };

  const toggleSelection = (pkgIndex: number) => {
    const pkg = currentGroup.packages[pkgIndex];
    const index = packages.findIndex(
      (p) => p.name === pkg.name && p.packagePath === pkg.packagePath,
    );

    if (index !== -1) {
      const updated = [...packages];
      updated[index].selected = !updated[index].selected;
      return updated;
    }

    return packages;
  };

  const changeVersionType = (pkgIndex: number, direction: "next" | "prev") => {
    const pkg = currentGroup.packages[pkgIndex];
    const index = packages.findIndex(
      (p) => p.name === pkg.name && p.packagePath === pkg.packagePath,
    );

    if (index !== -1) {
      const updated = [...packages];
      const types: PackageInfo["targetVersionType"][] = [
        "patch",
        "minor",
        "latest",
        "prerelease",
      ];
      const typeIndex = types.indexOf(updated[index].targetVersionType);
      const nextIndex =
        direction === "next"
          ? (typeIndex + 1) % types.length
          : (typeIndex - 1 + types.length) % types.length;

      updated[index].lastTargetVersionType = updated[index].targetVersionType;
      updated[index].targetVersionType = types[nextIndex];
      updated[index].displayVersion =
        getDisplayVersion(updated[index]) || updated[index].currentVersion;

      return updated;
    }

    return packages;
  };

  const changeGlobalVersionType = (direction: "next" | "prev") => {
    if (!currentGroup || !currentGroup.packages.length) {
      return packages;
    }

    const types: PackageInfo["targetVersionType"][] = [
      "patch",
      "minor",
      "latest",
      "prerelease",
    ];
    
    // Find the strategy of the currently selected package to use as reference
    const referencePackage = currentGroup.packages[cursor];
    const currentTypeIndex = types.indexOf(referencePackage.targetVersionType);
    
    // Determine the next strategy in sequence
    const nextTypeIndex =
      direction === "next"
        ? (currentTypeIndex + 1) % types.length
        : (currentTypeIndex - 1 + types.length) % types.length;
    
    const newStrategy = types[nextTypeIndex];
    
    const updated = [...packages];
    
    // Update all packages in the current group to the SAME new strategy
    for (const pkg of currentGroup.packages) {
      const index = updated.findIndex(
        (p) => p.name === pkg.name && p.packagePath === pkg.packagePath,
      );
      
      if (index !== -1) {
        updated[index].lastTargetVersionType = updated[index].targetVersionType;
        updated[index].targetVersionType = newStrategy;
        updated[index].displayVersion =
          getDisplayVersion(updated[index]) || updated[index].currentVersion;
      }
    }

    return updated;
  };

  const equalizeVersions = () => {
    if (!currentGroup || !currentGroup.packages.length) {
      return packages;
    }

    const current = currentGroup.packages[cursor];
    return packages.map((pkg) => {
      if (pkg.name === current.name) {
        const targetVersionType = current.targetVersionType;
        const displayVersion =
          getDisplayVersion({ ...pkg, targetVersionType }) ||
          pkg.currentVersion;
        return {
          ...pkg,
          selected: true,
          lastTargetVersionType: pkg.targetVersionType,
          targetVersionType,
          displayVersion,
        };
      }
      return pkg;
    });
  };

  const areVersionsEqual = (pkg: PackageInfo): boolean => {
    return semver.eq(
      semver.minVersion(pkg.currentVersion || "") ?? "",
      semver.minVersion(pkg.displayVersion || "") ?? "",
    );
  };

  const checkDivergingVersions = (packageName: string): boolean => {
    const allVersionsForDep = packages.filter((p) => p.name === packageName);
    const versionsInUse = new Set(
      allVersionsForDep.map((p) => p.currentVersion),
    );
    return versionsInUse.size > 1;
  };

  const hasHigherUpdates = (pkg: PackageInfo): boolean => {
    if (pkg.targetVersionType === "latest") return false;
    
    // If on patch and minor or latest exist, there are higher updates
    if (pkg.targetVersionType === "patch") {
      const hasMinorUpdate = pkg.minorVersion && pkg.minorVersion !== pkg.patchVersion;
      const hasLatestUpdate = pkg.latestVersion && (!pkg.patchVersion || semver.gt(pkg.latestVersion, pkg.patchVersion));
      return !!(hasMinorUpdate || hasLatestUpdate);
    }
    
    // If on minor and latest exists with higher version, there are higher updates
    if (pkg.targetVersionType === "minor") {
      return !!(pkg.latestVersion && (!pkg.minorVersion || semver.gt(pkg.latestVersion, pkg.minorVersion)));
    }
    
    return false;
  };

  return {
    cursor,
    setCursor,
    tabIndex,
    grouped,
    currentGroup,
    handleTabChange,
    toggleSelection,
    changeVersionType,
    changeGlobalVersionType,
    equalizeVersions,
    areVersionsEqual,
    checkDivergingVersions,
    hasHigherUpdates,
  };
}
