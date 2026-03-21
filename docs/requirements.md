# Markdown Editor Migration Requirements

## Scope
- Electron runtime to Tauri v2 migration for desktop packaging and runtime APIs.
- GitHub Actions release workflow migration to Tauri build pipeline.
- macOS targets must include both x64 and arm64 builds, while keeping Windows release builds.
- README rewrite in screenshot-style high-density format with badges, table of contents, install and safety sections.
- Tailwind CSS must be integrated in the frontend build pipeline and used in application code.
- Medium-scale refactoring: runtime API abstraction, type alignment, and duplicated desktop interaction logic reduction.
- Package manager is Bun for all local and CI flows.

## Out of Scope
- Code signing and notarization implementation in this phase.
- New end-user features unrelated to migration.
- Full UI redesign or complete CSS rewrite.

## Functional Requirements
1. Desktop runtime
- App launches with Tauri in development and production modes.
- Existing file operations remain available: open file, open recent file path, open folder, save file.
- Window controls and About dialog continue to work.
- File association commands continue to exist with platform-specific fallback.

2. Build and release
- Local build commands provide quick build and installable build paths.
- Release workflow uses Bun + Tauri and generates artifacts for:
  - windows-latest x64
  - macOS x64
  - macOS arm64

3. Documentation
- README documents migration state, install/build commands, runtime assumptions, and safety caveats.
- docs/requirements.md remains the source of truth for scope and acceptance criteria.

## Non-Functional Requirements
- Maintain existing editor behavior and data persistence where feasible.
- Keep TypeScript type checks and linting passing after migration.
- Keep CI reproducible with Bun lockfile.

## Acceptance Criteria
- `bun run dev:app` starts the Tauri desktop app.
- `bun run build:app@install` creates desktop bundles through Tauri.
- GitHub Actions release workflow matrix includes Windows + macOS x64 + macOS arm64.
- README includes: badges, quick start, commands, release/build section, and safety section.
- Tailwind is installed and used by the app at least in initial migrated UI surfaces.
