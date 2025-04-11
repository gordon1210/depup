import { Box, render, Text, useApp, useInput } from "ink";
import path from "path";
import React, { useState } from "react";

import { PackageList } from "./components/PackageList.js";
import { SideNav } from "./components/SideNav.js";
import { usePackageController } from "./hooks/usePackageController.js";
import { usePackageData } from "./hooks/usePackageData.js";

const VISIBLE_ROWS = 20;

const App = () => {
  const { packages, loading, updatePackages, updateDependencies } =
    usePackageData();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [packagesToUpdate, setPackagesToUpdate] = useState<typeof packages>([]);
  const {
    cursor,
    setCursor,
    grouped,
    currentGroup,
    handleTabChange,
    toggleSelection,
    changeVersionType,
    equalizeVersions,
    areVersionsEqual,
    checkDivergingVersions,
  } = usePackageController(packages);

  const { exit } = useApp();

  useInput((input, key) => {
    if (isUpdating) {
      return;
    } // Prevent input handling during updates

    if (input.toLowerCase() === "w" && !isConfirming) {
      handleTabChange("prev");
    } else if (input.toLowerCase() === "s" && !isConfirming) {
      handleTabChange("next");
    } else if (input.toLowerCase() === "e" && !isConfirming) {
      updatePackages(equalizeVersions());
    } else if (key.downArrow && !isConfirming) {
      setCursor((prev) => Math.min(prev + 1, currentGroup.packages.length - 1));
    } else if (key.upArrow && !isConfirming) {
      setCursor((prev) => Math.max(prev - 1, 0));
    } else if (input === " " && !isConfirming) {
      updatePackages(toggleSelection(cursor));
    } else if (key.leftArrow && !isConfirming) {
      updatePackages(changeVersionType(cursor, "prev"));
    } else if (key.rightArrow && !isConfirming) {
      updatePackages(changeVersionType(cursor, "next"));
    } else if (key.return) {
      if (isConfirming) {
        // User confirmed the updates
        setIsUpdating(true);
        setTimeout(() => {
          updateDependencies(packagesToUpdate);
          exit();
        }, 100); // Small delay to ensure render happens before updates start
      } else {
        // Show confirmation screen
        const toUpdate = packages.filter((p) => p.selected);
        if (toUpdate.length > 0) {
          setPackagesToUpdate(toUpdate);
          setIsConfirming(true);
        }
      }
    } else if (input === "q") {
      if (isConfirming) {
        // Go back to selection screen
        setIsConfirming(false);
        setPackagesToUpdate([]);
      } else {
        exit();
      }
    }
  });

  if (loading) {
    return <Text>🔍 Scanning dependencies...</Text>;
  }
  if (packages.length === 0) {
    return <Text>✅ No dependencies found.</Text>;
  }
  if (isUpdating) {
    return <Text>📦 Installing selected dependencies...</Text>;
  }
  if (isConfirming) {
    // Group packages by directory for a cleaner confirmation view
    const packagesByDir = packagesToUpdate.reduce(
      (acc, pkg) => {
        const dir = path.relative(process.cwd(), pkg.packagePath) || ".";
        if (!acc[dir]) {
          acc[dir] = [];
        }
        acc[dir].push(pkg);
        return acc;
      },
      {} as Record<string, typeof packagesToUpdate>,
    );

    return (
      <Box flexDirection="column">
        <Text bold>The following dependencies will be updated:</Text>

        {Object.entries(packagesByDir).map(([dir, pkgs]) => (
          <Box key={dir} flexDirection="column" marginTop={1}>
            <Text bold underline>
              {dir}/package.json
            </Text>
            {pkgs.map((pkg) => (
              <Text key={`${dir}-${pkg.name}`}>
                • {pkg.name}: {pkg.currentVersion} → {pkg.displayVersion}
              </Text>
            ))}
          </Box>
        ))}

        <Box marginTop={1}>
          <Text>
            This will update package.json files and run a single -pnpm install-
            at the end.
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text bold>Press Enter to confirm or q to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>
        📦 Select packages to update (⬆⬇ + Space, ⏎ confirm, q quit, ←→
        Version, W/S tabs, E equalize)
      </Text>
      <Box flexDirection="row">
        <SideNav groups={grouped} activeTab={grouped.indexOf(currentGroup)} visibleCount={VISIBLE_ROWS} />

        <PackageList
          packages={currentGroup.packages}
          cursor={cursor}
          visibleCount={VISIBLE_ROWS}
          packagePath={currentGroup.path}
          checkDivergingVersions={checkDivergingVersions}
          areVersionsEqual={areVersionsEqual}
        />
      </Box>
    </Box>
  );
};

render(<App />);
