import { Box, Text } from "ink";
import path from "path";
import React from "react";

import type { PackageInfo } from "../types.js";
import { progressBar } from "../utils.js";
import { PackageRow } from "./PackageRow.js";

interface PackageListProps {
  packages: PackageInfo[];
  cursor: number;
  visibleCount: number;
  packagePath: string;
  checkDivergingVersions: (name: string) => boolean;
  areVersionsEqual: (pkg: PackageInfo) => boolean;
}

export function PackageList({
  packages,
  cursor,
  visibleCount,
  packagePath,
  checkDivergingVersions,
  areVersionsEqual,
}: PackageListProps) {
  const start = Math.min(
    Math.max(0, cursor - Math.floor(visibleCount / 2)),
    Math.max(0, packages.length - visibleCount),
  );
  const visible = packages.slice(start, start + visibleCount);

  return (
    <Box flexDirection="column">
      <Text bold>
        📦 Select packages to update (⬆⬇ + Space, ⏎ confirm, q quit, ←→
        Version, W/S tabs, E equalize):{" "}
        {path.relative(process.cwd(), packagePath)}
      </Text>
      <Box flexDirection="row">
        <Box width={3}></Box>
        <Box width={32}>
          <Text bold>Name</Text>
        </Box>
        <Box width={14}>
          <Text bold>Current</Text>
        </Box>
        <Box width={19}>
          <Text bold>Target</Text>
        </Box>
        <Box width={12}>
          <Text bold>Strategy</Text>
        </Box>
        <Box flexGrow={1}>
          <Text bold>Location</Text>
        </Box>
      </Box>

      {visible.map((pkg, i) => {
        const absoluteIndex = start + i;
        const strategyChanged =
          pkg.lastTargetVersionType &&
          pkg.lastTargetVersionType !== pkg.targetVersionType;
        const unchanged = areVersionsEqual(pkg);
        const isDiverging = checkDivergingVersions(pkg.name);

        return (
          <PackageRow
            key={`${pkg.packagePath}-${pkg.name}`}
            pkg={pkg}
            isSelected={absoluteIndex === cursor}
            isDiverging={isDiverging}
            isVersionUnchanged={unchanged}
            hasStrategyChanged={Boolean(strategyChanged)}
          />
        );
      })}

      {packages.length > visibleCount && (
        <Box marginTop={1}>
          <Text dimColor>{progressBar(cursor + 1, packages.length)}</Text>
        </Box>
      )}
    </Box>
  );
}
