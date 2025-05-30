import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import path from "path";
import React, { Fragment, useEffect, useState } from "react";

import type { PackageGroup } from "../types.js";
import { truncateText } from "../utils.js";
import { ScrollingText } from "./ScrollingText.js";

const TARGET_HEIGHT = 26;

interface SideNavProps {
  groups: PackageGroup[];
  activeTab: number;
  visibleCount?: number;
  loading?: boolean;
}

export function SideNav({
  groups,
  activeTab,
  visibleCount,
  loading,
}: SideNavProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = setInterval(() => {
      setVisible((v) => !v);
    }, 1250);

    return () => clearInterval(timer);
  }, [loading]);

  const start = visibleCount
    ? Math.min(
        Math.max(0, activeTab - Math.floor(visibleCount / 2)),
        Math.max(0, groups.length - visibleCount),
      )
    : 0;
  const visibleGroups = visibleCount
    ? groups.slice(start, start + visibleCount)
    : groups;

  return (
    <Box flexDirection="column" marginRight={3}>
      {loading ? (
        <Text>
          <Text color="green">
            <Spinner type="dots" />
          </Text>{" "}
          {visible && "Scanning"}
        </Text>
      ) : (
        <Text>Package</Text>
      )}
      {visibleGroups.map((group, i) => {
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
            {actualIndex === activeTab ? (
              <ScrollingText 
                text={path.basename(group.path)}
                maxLength={13}
                isActive={actualIndex === activeTab}
                color={actualIndex === activeTab ? "green" : undefined}
                bold={actualIndex === activeTab}
              />
            ) : (
              truncateText(path.basename(group.path), 13)
            )}
            {selected > 0 ? ` (${selected})` : "    "}
          </Text>
        );
      })}

      {/* Add placeholder lines to maintain consistent height */}
      {(() => {
        // Calculate current content height
        // Count loading indicator if present
        const loadingLines = loading ? 1 : 0;
        // Count shared package divider as an extra line
        const sharedDividerLines = visibleGroups.some(
          (g) => g.path === "__SHARED__",
        )
          ? 1
          : 0;
        // Total content lines including groups and special elements
        const contentLines =
          visibleGroups.length + loadingLines + sharedDividerLines;
        // Calculate how many placeholder lines we need
        const placeholderCount = Math.max(0, TARGET_HEIGHT - contentLines);

        // Return array of placeholder lines
        return Array.from({ length: placeholderCount }).map((_, i) => (
          <Text key={`placeholder-${i}`}> </Text>
        ));
      })()}
    </Box>
  );
}
