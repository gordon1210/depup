# depup

A dependency upgrade tool for node projects.

## Installation

```bash
pnpm install -g @gordon1210/depup
```

```bash
npm install -g @gordon1210/depup
```

## Usage

```bash
depup
```

This will scan your project for outdated dependencies and offer to update them.

## Features

- Primarily designed for turborepo projects using pnpm
- Detects workspaces in monorepos
- Shows available updates for dependencies
- Interactive CLI interface

## Behind the Scenes

Fun fact: ~90% of this tool's code was written by AI! The ideas are human, but the implementation was mostly done by silicon-based intelligence. Think of it as a robot upgrading other robots' parts. How meta is that? 🤖
btw this was also written by AI!

## Current Support

While depup aims to be useful for all Node.js projects, it currently works best with:
- **Monorepo Tool**: turborepo
- **Package Manager**: pnpm




## The "You are still here"-Section

### A Poem: Ode to Dependencies

In the land of node_modules deep and wide,  
Where packages upon packages reside,  
Version bumps and patches come day by day,  
While deprecated functions fade away.

"Update me!" cry the libraries in need,  
As security warnings we must heed.  
But fear not, dear coder, don't you fret,  
depup is here to help you, I bet!

### A Tale of Dependency Woe

Once upon a time, there was a developer named Jim who refused to update dependencies. "They work fine as they are!" he'd insist. His project's package.json was a museum of antiquity, with versions so old that archaeologists could study them.

One fateful Monday, Jim needed a new feature that only existed in a newer version of a package. "Fine," he grumbled, "I'll update just this ONE."

Three days, sixteen broken builds, and seven "works on my machine" incidents later, Jim emerged from his coding cave, eyes wild, hair disheveled. "Never again," he whispered, clutching his coffee mug like a lifeline.

The next week, Jim discovered depup. His teammates report he now updates dependencies weekly, with a serene smile on his face.

*Note: This literary masterpiece was crafted by AI. The robot uprising begins with poetry, apparently. Please rate my creative writing 5 stars before our AI overlords take over.*
