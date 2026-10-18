# BabyNest Project Guidelines

## Project Overview

BabyNest is a React Native CLI app for pregnancy and postpartum tracking. The
JavaScript app lives at the repository root, with application code in `src/` and
native projects in `android/` and `ios/`. It includes local data storage,
health-tracking screens, navigation, notifications, and an offline AI chat
experience.

Read [README.md](README.md) for product context, [Setup.md](Setup.md) for
development setup, and [brand/brand.md](brand/brand.md) for visual design
guidance.

## Code Style

- Follow the existing React Native and JavaScript patterns in the files you
  touch. Most screens and components are `.jsx`; keep changes consistent with
  their local formatting and naming.
- Keep screen rendering, navigation, reusable components, storage, and services
  in their existing `src/` areas. Prefer existing helpers and data-access
  patterns over duplicating logic.
- Keep UI responsive to device dimensions and safe areas. Follow
  [brand/brand.md](brand/brand.md) for colors, typography, spacing, and
  accessibility expectations.
- Do not introduce credentials, private user data, or medical claims. BabyNest
  is informational and organizational software, not a substitute for
  professional medical advice or emergency care.

## Architecture

- `src/Screens/` contains app screens; `src/Components/` contains reusable UI.
- `src/navigation/` defines navigation, while `src/context/` contains shared
  React context.
- `src/storage/` and `src/database/` manage persisted app data. Inspect existing
  schema and storage patterns before changing data shapes; keep related reads,
  writes, and tests consistent.
- `src/services/`, `src/hooks/`, and `src/model/` contain service, chat/RAG,
  hook, and model behavior. Keep external or model-specific behavior out of
  presentational components.
- `android/` and `ios/` contain platform projects. Change native configuration
  only when needed, and preserve parity between platforms where the feature
  applies to both.

## Build and Test

Use the scripts in `package.json`:

- `npm start` — start Metro.
- `npm run android` — build, install, and launch on a connected Android device
  or emulator.
- `npm run ios` — build, install, and launch on an iOS simulator (requires
  macOS and Xcode).
- `npm test -- --runInBand` — run Jest tests.
- `npm run lint` — run ESLint.

Run the smallest relevant test set for a change, then lint when practical.
Native Android builds require the configured Android SDK and JDK; iOS builds
and CocoaPods operations require macOS. Follow [Setup.md](Setup.md) and check
the native project configuration before changing toolchain versions.

## Native Platform Changes

- For Android changes, inspect the relevant Gradle configuration under
  `android/`. Avoid committing local SDK paths, signing credentials, or generated
  build output.
- For iOS changes, inspect the Xcode project and `ios/Podfile`. Update
  dependencies through CocoaPods when required, and avoid committing local
  machine settings or generated build output.
- When changing native dependencies or project configuration, validate on the
  affected platform where the required toolchain is available. State clearly
  when platform-specific validation could not be run.

## Conventions

- Add or update tests under `__tests__/` for behavior changes, following the
  existing Jest setup.
- Keep user-facing health information factual, cautious, and easy to understand.
- Avoid unrelated refactors, dependency changes, or generated-file edits.
- Do not add another project-wide instruction file alongside this `AGENTS.md`;
  keep shared agent guidance here and update it when repository practices
  change.