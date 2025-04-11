import { Box, Text } from "ink";
import path from "path";
import React from "react";

import type { PackageInfo } from "../types.js";

interface PackageRowProps {
  pkg: PackageInfo;
  isSelected: boolean;
  isDiverging: boolean;
  isVersionUnchanged: boolean;
  hasStrategyChanged: boolean;
}

export function PackageRow({
  pkg,
  isSelected,
  isDiverging,
  isVersionUnchanged,
  hasStrategyChanged,
}: PackageRowProps) {
  // Use inverse for better visibility instead of background color
  return (
    <Box>
      <Box width={3}>
        <Text color={pkg.selected ? "green" : undefined} bold={isSelected}>
          {pkg.selected ? "✔" : isSelected ? ">" : " "}
        </Text>
      </Box>
      <Box width={32}>
        <Text 
          bold={isSelected || pkg.selected} 
          color={pkg.selected ? "green" : undefined} 
          inverse={isSelected}
        >
          {pkg.name}
        </Text>
      </Box>
      <Box width={14}>
        <Text 
          color={isDiverging ? "red" : undefined} 
          inverse={isSelected}
          bold={isSelected}
        >
          {pkg.currentVersion}
        </Text>
      </Box>
      <Box width={19}>
        <Text 
          color={isVersionUnchanged ? undefined : "cyan"} 
          inverse={isSelected}
          bold={isSelected}
        >
          {pkg.displayVersion}
        </Text>
      </Box>
      <Box width={12}>
        <Text 
          color={hasStrategyChanged ? "magentaBright" : "yellow"} 
          inverse={isSelected}
          bold={isSelected}
        >
          {pkg.targetVersionType}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={isSelected ? undefined : "gray"} inverse={isSelected}>
          {path.relative(process.cwd(), pkg.packagePath) || "."}
        </Text>
      </Box>
    </Box>
  );
}
