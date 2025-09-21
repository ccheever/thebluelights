# Repository Guidelines

## Project Structure & Module Organization
Keep the runtime entry point in `index.ts` at the repository root. Group reusable server logic under a `src/` directory (create it if missing) and mirror that layout in `tests/` for related specs. Configuration such as `tsconfig.json` and the Bun lockfile stay at the top level; avoid committing generated assets or local environment files.

## Build, Test, and Development Commands
- `bun install` downloads dependencies defined in `bun.lock`.
- `bun run index.ts` executes the TypeScript entry point once using Bun.
- `bun run --watch index.ts` is recommended during development for automatic reloads on file changes.
- `bun test` discovers `*.test.ts` files under `tests/` and runs them using Bun’s test runner.

## Coding Style & Naming Conventions
Write modern TypeScript that matches the strict settings in `tsconfig.json` (ESNext modules, no `any` escapes). Use 2-space indentation, single quotes for strings unless interpolation is needed, and prefer named exports from module files. File names should be kebab-case for modules (e.g., `user-service.ts`) and camelCase for variables/functions.

## Testing Guidelines
Co-locate tests in `tests/<feature>/<module>.test.ts` to reflect the source layout. Cover both public APIs and edge cases; new features should land with meaningful test coverage. Run `bun test` locally before pushing, and add regression tests whenever a bug is fixed. When tests rely on async flows, use `await`/`expect` rather than manual timers to keep runs stable.

## Commit & Pull Request Guidelines
Follow the repository’s precedent of short, imperative commit titles (e.g., "Add session bootstrap"). Each pull request should describe the change set, list impacted routes or modules, and call out any follow-up work. Link to relevant issues, include screenshots for observable changes, and confirm `bun test` output in the PR summary.

## Security & Environment Notes
Never commit secrets or production configuration. Use `.env.local` (gitignored) for local overrides, and document any required variables in the PR body. Review dependencies before adding them to keep the runtime lean.
