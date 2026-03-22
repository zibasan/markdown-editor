# markdown-editor

Fast Markdown editor with Monaco, split preview, and desktop packaging via Tauri.

![tauri](https://img.shields.io/badge/runtime-tauri%20v2-1f2937?logo=tauri&logoColor=ffc131)
![react](https://img.shields.io/badge/frontend-react%2019-1f2937?logo=react)
![typescript](https://img.shields.io/badge/lang-typescript%205.9-1f2937?logo=typescript)
![bun](https://img.shields.io/badge/pm-bun-1f2937)
![license](https://img.shields.io/badge/license-MIT-1f2937)

This repository is now on a Tauri-first track. Electron runtime code remains only as migration reference.

## Features

- Monaco-based Markdown editing with slash commands
- Split live preview
- Explorer / Outline / Docs side panel
- Recent file support and folder import
- Theme/language switching (ja/en)
- Desktop build targets: Windows + macOS (x64, arm64)

## Table Of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Release Automation](#release-automation)
- [Migration Status](#migration-status)
- [Safety](#safety)

## Installation

1) Install dependencies

```bash
bun install
```

2) Rust toolchain for Tauri build

```bash
rustup update
```

## Quick Start

```bash
# Web only
bun run dev:web

# Tauri desktop app
bun run dev:app

# Production web build
bun run build:web

# Tauri desktop build (bundle)
bun run build:app@install
```

## Commands

- `bun run dev:web`
- `bun run dev:app`
- `bun run build:web`
- `bun run build:app@quick`
- `bun run build:app@install`
- `bun run build:app@full`
- `bun run release_app`
- `bun run lint`
- `bun run biome:check`

## Release Automation

Release workflow file:

- `.github/workflows/release.yml`

Behavior:

1. Push tag `v*`
2. Workflow uses Bun + Tauri action
3. Builds matrix targets:
- `x86_64-pc-windows-msvc`
- `x86_64-apple-darwin`
- `aarch64-apple-darwin`
4. Uploads artifacts to GitHub Releases

## Migration Status

- Runtime switched to Tauri v2
- CI switched from pnpm to Bun
- Tailwind CSS integrated into Vite pipeline
- Detailed requirements are defined in [docs/requirements.md](docs/requirements.md)

## Safety

- This phase ships unsigned builds (code signing/notarization is out of scope)
- File association write is best-effort and platform-dependent
- Folder import intentionally limits to `.md` and `.txt`

## License

MIT License
