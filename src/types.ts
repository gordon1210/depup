export interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  patchVersion?: string;
  minorVersion?: string;
  prereleaseVersion?: string;
  displayVersion: string;
  packagePath: string;
  packageJsonPath: string;
  selected: boolean;
  disabled: boolean;
  targetVersionType: "latest" | "minor" | "patch" | "prerelease";
  lastTargetVersionType?: string;
}

export interface PackageGroup {
  path: string;
  packages: PackageInfo[];
}
