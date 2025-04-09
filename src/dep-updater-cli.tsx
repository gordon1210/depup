import { Box, render, Text, useApp, useInput } from "ink";
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

    if (input.toLowerCase() === "w") {
      handleTabChange("prev");
    } else if (input.toLowerCase() === "s") {
      handleTabChange("next");
    } else if (input.toLowerCase() === "e") {
      updatePackages(equalizeVersions());
    } else if (key.downArrow) {
      setCursor((prev) => Math.min(prev + 1, currentGroup.packages.length - 1));
    } else if (key.upArrow) {
      setCursor((prev) => Math.max(prev - 1, 0));
    } else if (input === " ") {
      updatePackages(toggleSelection(cursor));
    } else if (key.leftArrow) {
      updatePackages(changeVersionType(cursor, "prev"));
    } else if (key.rightArrow) {
      updatePackages(changeVersionType(cursor, "next"));
    } else if (key.return) {
      const toUpdate = packages.filter((p) => p.selected);
      if (toUpdate.length > 0) {
        setIsUpdating(true);
        setTimeout(() => {
          updateDependencies(toUpdate);
          exit();
        }, 100); // Small delay to ensure render happens before updates start
      }
    } else if (input === "q") {
      exit();
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

  return (
    <Box flexDirection="row">
      <SideNav groups={grouped} activeTab={grouped.indexOf(currentGroup)} />

      <PackageList
        packages={currentGroup.packages}
        cursor={cursor}
        visibleCount={VISIBLE_ROWS}
        packagePath={currentGroup.path}
        checkDivergingVersions={checkDivergingVersions}
        areVersionsEqual={areVersionsEqual}
      />
    </Box>
  );
};

render(<App />);
