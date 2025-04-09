import { Box, Text } from 'ink';
import path from 'path';
import React, { Fragment } from 'react';

import type { PackageGroup } from '../types';

interface SideNavProps {
  groups: PackageGroup[];
  activeTab: number;
}

export function SideNav({ groups, activeTab }: SideNavProps) {
  return (
    <Box flexDirection="column" marginRight={2}>
      {groups.map((group, i) => {
        if (group.path === '__SHARED__') {
          return (
            <Fragment key="__shared__">
              <Text>────────────</Text>
              <Text
                color={i === activeTab ? 'green' : undefined}
                bold={i === activeTab}
              >
                shared-packages
              </Text>
            </Fragment>
          );
        }
        
        const selected = group.packages.filter((p) => p.selected).length;
        
        return (
          <Text
            key={group.path}
            color={i === activeTab ? 'green' : undefined}
            bold={i === activeTab}
          >
            {path.basename(group.path)}
            {selected > 0 ? ` (${selected})` : ''}
          </Text>
        );
      })}
    </Box>
  );
}
