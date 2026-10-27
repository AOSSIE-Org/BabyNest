# BabyNest — Project Audit Report

**Audit type:** Peer code and feature review  
**Project:** BabyNest (pregnancy tracking app with a local AI assistant)  
**Platform target:** Android 16 / iOS (configured for the project’s current native targets)  
**Build artifact:** Android App Bundle (AAB), approximately **104 MB**  
**Audit date:** 2026-10-24 (YYYY-MM-DD format)

## 1. Project Configuration

| Item | Current configuration |
|---|---|
| React Native | 0.77.1 |
| React | 18.3.1 |
| Android Gradle Plugin | 8.7.2 |
| Gradle wrapper | 8.10.2 |
| Android Build Tools | 36.0.0 |
| `minSdkVersion` | 24 |
| `compileSdkVersion` | 36 |
| `targetSdkVersion` | 36 |
| NDK | 28.0.13004108 |
| Kotlin | 2.0.21 |

*Versions are based on the project configuration available for this audit; verify them against the current lockfile and Gradle files before merging.*

## 2. Scope Reviewed

- App setup and Android build configuration.
- Local data storage and AI model handling.
- Dependency installation/build warnings.
- Automated test results.
- Release bundle size and basic release readiness.

## 3. Findings

| ID | Severity | Finding | Status / recommendation |
|---|---|---|---|
| AUD-01 | Medium | `npm test` reports **1 failed suite, 1 passed suite; 1 failed test and 27 passed**. The failure is in `__tests__/EmergencyCallingScreen.test.js`. | Investigate and fix the failing test; confirm the emergency screen’s actual behavior matches the test expectations. |
| AUD-02 | Medium | `npm install` and `npm run android` show warnings about older dependencies. The project currently relies on locked dependency versions. | Review warnings individually. Avoid blanket upgrades; update dependencies in a separate, tested change where compatibility permits. |
| AUD-03 | Medium | `compileSdkVersion` and `targetSdkVersion` are 36, while the project resolves Android Gradle Plugin 8.7.2 and Gradle 8.10.2. This toolchain may not fully support API 36. | Validate the build toolchain against Android API 36 requirements and upgrade AGP/Gradle together if required. Rebuild and test before release. |
| AUD-04 | Low | The Android AAB is approximately 104 MB. The local AI model may contribute significantly to app size or download/storage use, depending on packaging. | Confirm whether the model is bundled or downloaded on demand; document download size, storage use, loading behavior, and failure handling. Consider size optimization if needed. |
| AUD-05 | Review note | App data is stored locally, and the project does not use an API key for a remote backend. The local AI model is downloaded on demand and loaded into memory for inference. | Verify local database handling, permissions, model-download failure/retry behavior, and memory usage on lower-end devices. |

## 4. Privacy and Data Handling

- **Storage:** Application data is intended to remain on the device.
- **AI processing:** The app uses a local model; no remote AI API key is used.
- **Audit limitation:** These statements describe the intended architecture and were not independently verified through network-traffic analysis. Confirm that no sensitive user data is transmitted by any dependency or other app feature.

## 5. Test and Build Summary

- **Automated tests:** 27 passed, 1 failed (28 total).
- **Failing test:** `__tests__/EmergencyCallingScreen.test.js`.
- **Android bundle:** Approximately 104 MB.
- **Build/dependency warnings:** Older locked dependency versions produce warnings during installation/build; each warning should be assessed for actual impact.

## 6. Overall Assessment

**Result: Follow-up fixes recommended before release.**

Priorities are to resolve the emergency-screen test failure, verify API 36 toolchain compatibility, and review dependency warnings. Also validate local-only data handling and on-demand model behavior on a physical device. This report records the information available at audit time; it does not claim that every feature or code path has been independently exercised.

## 7. Remediation Tracking

Update this section when findings are addressed:

- [ ] **AUD-01:** Fix the failing emergency-screen test and rerun `npm test`.
- [ ] **AUD-02:** Review and document dependency warnings; make only tested, compatible updates.
- [ ] **AUD-03:** Verify or align AGP/Gradle with API 36 support; rerun the Android build.
- [ ] **AUD-04:** Measure model download/storage impact and assess bundle-size optimizations.
- [ ] **AUD-05:** Validate local data privacy, model-download errors, and low-memory behavior.
