import { Box, Text } from "ink";
import path from "path";
import React from "react";

import type { PackageInfo } from "../types.js";
import { truncateText } from "../utils.js";
import { ScrollingText } from "./ScrollingText.js";

interface PackageRowProps {
  pkg: PackageInfo;
  isSelected: boolean;
  isDiverging: boolean;
  isVersionUnchanged: boolean;
  hasHigherUpdates: boolean;
}

export function PackageRow({
  pkg,
  isSelected,
  isDiverging,
  isVersionUnchanged,
  hasHigherUpdates,
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
          color={pkg.selected ? "green" : "yellow"} 
          inverse={isSelected}
        >
          {isSelected ? (
            <ScrollingText 
              text={pkg.name}
              maxLength={30} // Slightly less than column width for safety
              isActive={isSelected}
              bold={isSelected || pkg.selected}
              color={pkg.selected ? "green" : "yellow"}
              inverse={isSelected}
            />
          ) : (
            pkg.name
          )}
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
        {hasHigherUpdates && <Text color="cyan"> *</Text>}
      </Box>
      <Box width={12}>
        <Text 
          color={"magentaBright"} 
          inverse={isSelected}
          bold={isSelected}
        >
          {pkg.targetVersionType}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={isSelected ? undefined : "gray"} inverse={isSelected}>
          <ScrollingText 
            text={path.relative(process.cwd(), pkg.packagePath) || "."}
            maxLength={24}
            isActive={true} // Always active for paths
            color={isSelected ? undefined : "gray"}
            inverse={isSelected}
            interval={5000} // Longer interval for paths to reduce distraction
          />
        </Text>
      </Box>
    </Box>
  );
}
