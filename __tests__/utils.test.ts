import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { getDisplayVersion, detectWorkspaces, progressBar, truncateText } from '../src/utils.js';
import type { PackageInfo } from '../src/types.js';

describe('utils', () => {
  describe('getDisplayVersion', () => {
    const base: PackageInfo = {
      name: 'dep',
      currentVersion: '1.0.0',
      latestVersion: '1.2.0',
      patchVersion: '1.0.1',
      minorVersion: '1.1.0',
      displayVersion: '',
      packagePath: '.',
      packageJsonPath: './package.json',
      selected: false,
      disabled: false,
      targetVersionType: 'patch',
    };

    it('returns patch version with tilde', () => {
      const result = getDisplayVersion({ ...base, targetVersionType: 'patch' });
      expect(result).toBe('~1.0.1');
    });

    it('returns minor version with caret', () => {
      const result = getDisplayVersion({ ...base, targetVersionType: 'minor' });
      expect(result).toBe('^1.1.0');
    });

    it('returns latest version when stable', () => {
      const result = getDisplayVersion({ ...base, targetVersionType: 'latest' });
      expect(result).toBe('1.2.0');
    });
  });

  describe('detectWorkspaces', () => {
    it('detects pnpm-workspace.yaml', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ws-'));
      await fs.writeFile(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
      const ws = await detectWorkspaces(dir);
      expect(ws).toEqual(['packages/*']);
    });

    it('detects workspaces from package.json', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ws-'));
      await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ workspaces: ['pkg/*'] }));
      const ws = await detectWorkspaces(dir);
      expect(ws).toEqual(['pkg/*']);
    });
  });

  describe('progressBar', () => {
    it('creates a progress bar string', () => {
      const bar = progressBar(5, 10, 10);
      expect(bar).toContain('5/10');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const t = truncateText('abcdefghij', 6);
      expect(t).toBe('abc...');
    });

    it('returns short text unchanged', () => {
      const t = truncateText('abc', 6);
      expect(t).toBe('abc');
    });
  });
});
