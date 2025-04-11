import { Box, Text } from "ink";
import React from "react";

import type { PackageInfo } from "../types.js";
import { progressBar } from "../utils.js";
import { PackageRow } from "./PackageRow.js";

interface PackageListProps {
  packages: PackageInfo[];
  cursor: number;
  visibleCount: number;
  checkDivergingVersions: (name: string) => boolean;
  areVersionsEqual: (pkg: PackageInfo) => boolean;
  hasHigherUpdates: (pkg: PackageInfo) => boolean;
}

export function PackageList({
  packages,
  cursor,
  visibleCount,
  checkDivergingVersions,
  areVersionsEqual,
  hasHigherUpdates,
}: PackageListProps) {
  const start = Math.min(
    Math.max(0, cursor - Math.floor(visibleCount / 2)),
    Math.max(0, packages.length - visibleCount),
  );
  const visible = packages.slice(start, start + visibleCount);

  return (
    <Box flexDirection="column">
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
        const unchanged = areVersionsEqual(pkg);
        const isDiverging = checkDivergingVersions(pkg.name);

        return (
          <PackageRow
            key={`${pkg.packagePath}-${pkg.name}`}
            pkg={pkg}
            isSelected={absoluteIndex === cursor}
            isDiverging={isDiverging}
            isVersionUnchanged={unchanged}
            hasHigherUpdates={hasHigherUpdates(pkg)}
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
