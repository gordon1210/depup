import { renderHook, act } from '@testing-library/react';
import { usePackageController } from '../src/hooks/usePackageController.js';
import type { PackageInfo } from '../src/types.js';

const basePkg = (name: string, version: string, dir: string): PackageInfo => ({
  name,
  currentVersion: version,
  latestVersion: '1.2.0',
  patchVersion: '1.0.1',
  minorVersion: '1.1.0',
  displayVersion: '~1.0.1',
  packagePath: dir,
  packageJsonPath: dir + '/package.json',
  selected: false,
  disabled: false,
  targetVersionType: 'patch',
});

describe('usePackageController', () => {
  it('toggles selection', () => {
    const pkgs = [basePkg('dep', '1.0.0', '/pkg')];
    const { result } = renderHook(() => usePackageController(pkgs));
    const updated = act(() => result.current.toggleSelection(0));
    expect(updated[0].selected).toBe(true);
  });

  it('changes version type', () => {
    const pkgs = [basePkg('dep', '1.0.0', '/pkg')];
    const { result } = renderHook(() => usePackageController(pkgs));
    const updated = act(() => result.current.changeVersionType(0, 'next'));
    expect(updated[0].targetVersionType).toBe('minor');
  });

  it('checks diverging versions', () => {
    const pkgs = [basePkg('dep', '1.0.0', '/pkg'), basePkg('dep', '1.1.0', '/pkg2')];
    const { result } = renderHook(() => usePackageController(pkgs));
    expect(result.current.checkDivergingVersions('dep')).toBe(true);
  });

  it('detects version equality', () => {
    const pkg = basePkg('dep', '1.0.0', '/pkg');
    pkg.displayVersion = '1.0.0';
    const { result } = renderHook(() => usePackageController([pkg]));
    expect(result.current.areVersionsEqual(pkg)).toBe(true);
  });
});
