# DepUp

A dependency upgrade tool for node projects.

## Installation

```bash
npm install -g @gordon1210/depup
```

## Usage

```bash
depup
```

This will scan your project for outdated dependencies and offer to update them.

## Features

- Detects workspaces in monorepos
- Shows available updates for dependencies
- Interactive CLI interface

## Development

### Publishing to NPM

This package is automatically published to npm via GitHub Actions when:

1. A new GitHub Release is created
2. The "Publish to NPM" workflow is manually triggered

To manually trigger a release:
1. Go to the Actions tab in GitHub
2. Select the "Publish to NPM" workflow
3. Click "Run workflow"
4. Choose version increment: patch (0.0.x), minor (0.x.0), or major (x.0.0)
5. Click "Run workflow"

This will automatically:
- Bump the version in package.json
- Create a git tag
- Build the package
- Publish to npm

### Requirements for Publishing

You need to add an NPM_TOKEN secret to your GitHub repository:

1. Generate an npm token: https://docs.npmjs.com/creating-and-viewing-access-tokens
2. Go to your repo settings > Secrets > Actions
3. Add a new secret named NPM_TOKEN with your npm token as the value
