import { Box, Text } from 'ink';
import path from 'path';
import React from 'react';

import type { PackageInfo } from '../types';

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
  return (
    <Box>
      <Box width={3}>
        <Text color={isSelected ? 'green' : undefined}>
          {pkg.selected ? '✔' : ' '}
        </Text>
      </Box>
      <Box width={32}>
        <Text bold={isSelected} color={isSelected ? 'green' : undefined}>
          {pkg.name}
        </Text>
      </Box>
      <Box width={14}>
        <Text color={isDiverging ? 'red' : undefined}>
          {pkg.currentVersion}
        </Text>
      </Box>
      <Box width={19}>
        <Text color={isVersionUnchanged ? undefined : 'cyan'}>
          {pkg.displayVersion}
        </Text>
      </Box>
      <Box width={12}>
        <Text color={hasStrategyChanged ? 'magentaBright' : 'yellow'}>
          {pkg.targetVersionType}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text color="gray">
          {path.relative(process.cwd(), pkg.packagePath) || '.'}
        </Text>
      </Box>
    </Box>
  );
}
