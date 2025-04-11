import { Box, Text } from "ink";
import path from "path";
import React, { Fragment } from "react";

import type { PackageGroup } from "../types.js";

interface SideNavProps {
  groups: PackageGroup[];
  activeTab: number;
  visibleCount?: number;
}

export function SideNav({ groups, activeTab, visibleCount }: SideNavProps) {
  // Calculate which groups should be visible
  const start = visibleCount
    ? Math.min(
        Math.max(0, activeTab - Math.floor(visibleCount / 2)),
        Math.max(0, groups.length - visibleCount)
      )
    : 0;
  const visible = visibleCount
    ? groups.slice(start, start + visibleCount)
    : groups;

  return (
    <Box flexDirection="column" marginRight={2} marginTop={1}>
      {visible.map((group, i) => {
        const actualIndex = start + i;
        
        if (group.path === "__SHARED__") {
          return (
            <Fragment key="__shared__">
              <Text>────────────</Text>
              <Text
                color={actualIndex === activeTab ? "green" : undefined}
                bold={actualIndex === activeTab}
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
            color={actualIndex === activeTab ? "green" : undefined}
            bold={actualIndex === activeTab}
          >
            {path.basename(group.path)}
            {selected > 0 ? ` (${selected})` : ""}
          </Text>
        );
      })}
    </Box>
  );
}
