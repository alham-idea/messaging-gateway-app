# Android Build Investigation — 2026-08-23

## Root cause identified

The project used Expo SDK 54 with `expo-sqlite` 55.0.11, while the Expo compatibility checker expected `expo-sqlite` 16.0.10. The workspace also contained both `pnpm-lock.yaml` and a newly generated `package-lock.json`, which could make CI/EAS infer the wrong package manager and install a mixed dependency tree. The Metro configuration used deprecated `resolver.blacklistRE` and an unsupported `watchman` option. The Expo SQLite web worker error was a symptom of the incompatible/mixed dependency installation and affected the development web preview; it was not an Android native runtime error.

## Changes applied

- Updated Expo packages to the SDK 54 compatible versions selected by `expo install --check`.
- Set `expo-sqlite` to `~16.0.10`.
- Added direct `expo-asset` dependency at `~12.0.13` for the `expo-audio` peer requirement.
- Added `babel-preset-expo` `~54.0.12` as a development dependency.
- Removed the generated `package-lock.json` and restored a pnpm-only lockfile workflow.
- Added `expo-font`, `expo-sqlite`, and `expo-web-browser` to the dynamic Expo config plugins.
- Replaced Metro `blacklistRE` with `blockList` and removed the unsupported `watchman` configuration.

## Verification

- `npx expo config --type public --json` succeeds and resolves the Android package and plugins.
- `npx expo export --platform android --output-dir /tmp/expo-export-android` succeeds and creates the Android Hermes bundle.
- Full native APK/EAS build was not run in the sandbox; the final APK should be generated using the Manus Build/Publish action after this checkpoint.

## Remaining checks

- Run `npx expo-doctor` again to confirm dependency health.
- Run the project's TypeScript check and address any independent test-only errors if they remain.
