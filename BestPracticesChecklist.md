# AOSSIE Best Practices Checklist

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.

> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard.
> Scorecard already handles: License, SAST tools, CI tests, Security Policy file, Branch Protection,
> Pinned Dependencies, Signed Releases, Maintained status, and Known Vulnerabilities.
>
> **How to use:**
> 1. Fill in checkboxes below — tick `[x]` for Met, leave `[ ]` for Unmet, use `[~]` for N/A
> 2. Add a brief note or URL after each item as evidence
> 3. Run the checklist-score workflow to update the badge automatically
>
> **Legend:**
> - 🔴 MUST — Required for passing
> - 🟡 SHOULD — Required unless documented rationale given
> - 🔵 SUGGESTED — Optional but recommended
> - ⚪ N/A — Mark `[~]` if not applicable, add justification

---

## Score Summary

<!-- Auto-updated by checklist-score.yml workflow — do not edit manually -->
| Category           | Met | Total | Status |
|--------------------|-----|-------|--------|
| Basics             | 8   | 8     | 🔴     |
| Change Control     | 0   | 6     | 🔴     |
| Reporting          | 0   | 8     | 🔴     |
| Quality            | 0   | 11    | 🔴     |
| Security           | 0   | 9     | 🔴     |
| Analysis           | 0   | 7     | 🔴     |
| **Total**          | **0** | **49** | **0%** |
---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README/website clearly describes what the software does and what problem it solves.
  - *Evidence URL:* [README.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/README.md)

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* [CONTRIBUTING.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/CONTRIBUTING.md)

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process (e.g., PRs are used, how to open one).
  - *Evidence URL:* [CONTRIBUTING.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/CONTRIBUTING.md)

- [x] 🟡 **contribution_requirements** — `CONTRIBUTING.md` references acceptable contribution standards (coding style, tests required, etc.).
  - *Evidence URL:* [CONTRIBUTING.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/CONTRIBUTING.md)

- [x] 🔴 **documentation_basics** — Basic documentation exists for the software (README, Wiki, or docs folder).
  - *Evidence URL:* [README.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/README.md) and [PRIVACY_POLICY.md](https://github.com/AOSSIE-Org/BabyNest/blob/main/PRIVACY_POLICY.md)

- [x] 🔴 **documentation_interface** — Reference documentation describes the external interface (API inputs/outputs, CLI flags, config schema, etc.).
  - *Evidence URL:* `[ ]` N/A — *Justification (no external interface):*

### Other Basics

- [x] 🔴 **discussion** — Project has a searchable, URL-addressable discussion mechanism (GitHub Issues, Discord with archive, mailing list, etc.) that doesn't require proprietary client software.
  - *Evidence URL:* [GitHub Issues](https://github.com/AOSSIE-Org/BabyNest/issues) and [GitHub Discussions](https://github.com/AOSSIE-Org/BabyNest/discussions)

- [x] 🟡 **english** — Documentation is provided in English and English bug reports/comments are accepted.
  - *Note:* Yes, all documentation and discussion is in English.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS (e.g., git). *(SUGGESTED)*
  - *Evidence URL:* [GitHub Repository](https://github.com/AOSSIE-Org/BabyNest) and used git for development.

### Version Numbering

- [ ] 🔴 **version_unique** — Each release has a unique version identifier (e.g., v1.0.0).
  - *Evidence URL:* No releases yet, but will use unique version identifiers for future releases.

- [ ] 🔵 **version_semver** — Project uses [SemVer](https://semver.org) or [CalVer](https://calver.org/) format. *(SUGGESTED)*
  - *Note:*

- [ ] 🔵 **version_tags** — Releases are tagged in the VCS (e.g., `git tag v1.0.0`). *(SUGGESTED)*
  - *Evidence URL:* No releases yet, but will tag future releases in the VCS.

### Release Notes

- [ ] 🔴 **release_notes** — Each release includes human-readable release notes summarizing major changes. Raw `git log` output is NOT acceptable.
  - *Evidence URL:* `[ ]` N/A — *Justification (continuous delivery / no external reuse):*

- [ ] 🔴 **release_notes_vulns** — Release notes identify every publicly known vulnerability (with CVE) fixed in that release.
  - *Evidence URL:* `[ ]` N/A — *Justification (no publicly known vulns / users can't self-update):*

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists (e.g., GitHub Issues link in README).
  - *Evidence URL:* [GitHub Issues](https://github.com/AOSSIE-Org/BabyNest/issues)

- [x] 🟡 **report_tracker** — An issue tracker (e.g., GitHub Issues) is used to track individual bugs.
  - *Evidence URL:* [GitHub Issues](https://github.com/AOSSIE-Org/BabyNest/issues)

- [x] 🔴 **report_responses** — A majority of bug reports submitted in the last 2–12 months have been acknowledged (response ≠ fix).
  - *Self-certification note:* Maintainers will respond to bug reports in a timely manner, but no reports have been submitted yet.

- [x] 🟡 **enhancement_responses** — More than 50% of enhancement requests in the last 2–12 months have received a response.
  - *Self-certification note:* Maintainers will respond to enhancement requests in a timely manner, but no requests have been submitted yet.

- [x] 🔴 **report_archive** — Reports and responses are publicly archived and searchable (GitHub Issues satisfies this).
  - *Evidence URL:* [Archived Issues](https://github.com/AOSSIE-Org/BabyNest/issues?q=is%3Aissue+state%3Aclosed)

### Vulnerability Reporting

- [ ] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented (e.g., `SECURITY.md`).
  - *Evidence URL:* No `SECURITY.md` yet, but will create one for future vulnerability reporting.

- [ ] 🟡 **vulnerability_report_private** — If private vulnerability reporting is supported, the method for private submission is documented.
  - *Evidence URL:* `[ ]` N/A — No private vulnerability reporting supported.

- [ ] 🔴 **vulnerability_report_response** — Initial response to any vulnerability report received in the last 6 months was within 14 days.
  - *Self-certification note:* `[ ]` N/A — no vulnerability reports received

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — If the project requires building, a working build system exists that can auto-rebuild from source.
  - *Evidence URL:* `[ ]` N/A — `npx react-native run-android` works for Android, `npx react-native run-ios` works for iOS.

- [x] 🔵 **build_common_tools** — Common build tools are used (npm, pip, cargo, make, gradle, etc.). *(SUGGESTED)*
  - *Evidence URL:* `[ ]` N/A — `npx react-native` and `gradle` are common build tools for React Native projects.

- [x] 🟡 **build_floss_tools** — The project can be built using only FLOSS tools.
  - *Note:* `[ ]` N/A — React Native is FLOSS tools.

### Automated Testing

- [x] 🔵 **test_invocation** — The test suite can be invoked in a standard way for the language (e.g., `npm test`, `pytest`, `cargo test`). *(SUGGESTED)*
  - *Evidence URL:* npm test works for the project.

- [ ] 🔵 **test_most** — The test suite covers most code branches, input fields, and functionality. *(SUGGESTED)*
  - *Estimated coverage %:*

### New Functionality Testing Policy

- [x] 🔴 **test_policy** — The project has a general policy that new functionality must include tests in the automated test suite.
  - *Evidence (CONTRIBUTING reference or informal policy):* CONTRIBUTING.md mentions that contributors should include unit tests if applicable.

- [x] 🔴 **tests_are_added** — Evidence exists that the test policy has been followed in recent major changes (e.g., PRs include tests).
  - *Evidence URL (recent PR with tests):* [Latest PR test case](https://github.com/rahul-vyas-dev/BabyNest/commit/f8ec7ef42fae8a53271e4d80bb658949975a1eeb#diff-f7490536b0f57cc4b2ecd89c889488357c4971325cdb0a9d7a1f034c241459ec)

- [x] 🔵 **tests_documented_added** — The test policy is documented in contribution instructions. *(SUGGESTED)*
  - *Evidence URL:* CONTRIBUTING.md mentions that contributors should include unit tests if applicable.

### Linting / Warning Flags

- [x] 🔴 **warnings** — At least one linter or compiler warning flag is enabled (ESLint, Pylint, clippy, golangci-lint, Slither for Solidity, etc.).
  - *Tool used:* ESLint for React Native.

- [x] 🔴 **warnings_fixed** — Warnings from the linter are addressed (not suppressed without reason).
  - *Note:* Yes, warnings are addressed in the codebase.

- [ ] 🔵 **warnings_strict** — Project uses maximum strictness in linter config where practical. *(SUGGESTED)*
  - *Note:*

---

## 🔐 Security

### Secure Development Knowledge

- [ ] 🔴 **know_secure_design** — At least one primary developer knows how to design secure software (familiar with OWASP, threat modeling, secure-by-default principles).
  - *Self-certification note:* 

- [ ] 🔴 **know_common_errors** — At least one primary developer knows common vulnerability types for this software's category and how to mitigate them (e.g., injection, XSS, reentrancy for Solidity, prompt injection for AI).
  - *Self-certification note:*

### Cryptography (mark N/A if project does not handle cryptography)

- [ ] 🔴 **crypto_published** — Only publicly reviewed cryptographic protocols/algorithms are used by default.
  - *Note:* `[ ]` N/A

- [ ] 🟡 **crypto_call** — Project calls an established crypto library rather than reimplementing crypto functions.
  - *Library used:* `[ ]` N/A

- [ ] 🔴 **crypto_working** — No broken algorithms (MD4, MD5, single DES, RC4, Dual_EC_DRBG) used unless required for interoperability (must be documented).
  - *Note:* `[ ]` N/A

- [ ] 🔴 **crypto_keylength** — Key lengths meet [NIST 2030 minimums](https://www.keylength.com/en/4/) by default.
  - *Note:* `[ ]` N/A

- [ ] 🔴 **crypto_password_storage** — Passwords for external users are stored as iterated salted hashes (Argon2id, bcrypt, scrypt, PBKDF2).
  - *Note:* `[ ]` N/A — *Justification (project doesn't store passwords):*

- [ ] 🔴 **crypto_random** — Cryptographic keys and nonces are generated using a CSPRNG; insecure generators (Math.random, rand()) are NOT used for security purposes.
  - *Note:* `[ ]` N/A

- [ ] 🟡 **delivery_unsigned** — Cryptographic hashes are NOT retrieved over plain HTTP without a signature check.
  - *Note:*

---

## 🔬 Analysis

### Static Code Analysis

- [ ] 🔴 **static_analysis_fixed** — All medium+ severity vulnerabilities found by static analysis are fixed in a timely manner after confirmation.
  - *Note:* `[ ]` N/A:  Yes, no medium+ severity vulnerabilities found yet.

- [ ] 🔵 **static_analysis_common_vulnerabilities** — The static analysis tool includes checks for common vulnerabilities in the language/environment (e.g., eslint-plugin-security, bandit, Slither). *(SUGGESTED)*
  - *Tool + ruleset:* `[ ]` N/A

- [ ] 🔵 **static_analysis_often** — Static analysis runs on every commit or at least daily (CI integration). *(SUGGESTED)*
  - *Evidence URL:* `[ ]` N/A

### Dynamic Code Analysis

- [ ] 🔵 **dynamic_analysis** — At least one dynamic analysis tool is applied before major releases (fuzzer, web app scanner like OWASP ZAP, etc.). *(SUGGESTED)*
  - *Tool used:* `[ ]` N/A — *Justification:*

- [ ] 🔵 **dynamic_analysis_enable_assertions** — Dynamic analysis / testing runs with assertions enabled (not just production mode). *(SUGGESTED)*
  - *Note:*

- [ ] 🔴 **dynamic_analysis_fixed** — Medium+ severity vulnerabilities found by dynamic analysis are fixed in a timely manner.
  - *Note:* `[ ]` N/A

- [ ] 🔵 **dynamic_analysis_unsafe** — If the project uses memory-unsafe languages (C/C++), memory safety tools (Valgrind, AddressSanitizer) are used. *(SUGGESTED)*
  - *Note:* `[ ]` N/A — *Justification (project uses memory-safe languages):*

---

## 📎 Project-Specific Notes

> Add domain-specific notes here for Web3, Full-Stack, or AI projects.

### Web3 / Solidity Notes
- Scorecard does not audit Solidity-specific security. Use [Slither](https://github.com/crytic/slither) for `static_analysis` and `warnings` criteria.
- For `crypto_*` criteria, document which cryptographic primitives your contracts rely on (e.g., ECDSA in EVM is standard).
- Smart contract audit reports count as evidence for `know_secure_design`.

### Full-Stack / Next.js Notes
- For `crypto_password_storage`: document which auth library handles hashing (e.g., NextAuth + bcrypt).
- For `dynamic_analysis`: [OWASP ZAP](https://www.zaproxy.org/) can be run as a GitHub Action.

### AI / LLM Notes
- For `know_common_errors`: include awareness of prompt injection, data leakage, and model output validation.
- For `dynamic_analysis`: consider adversarial input testing as a form of dynamic analysis.

---

*This checklist complements [OpenSSF Scorecard](https://scorecard.dev/) (auto-detected checks) and is
inspired by the [OpenSSF Best Practices Badge](https://www.bestpractices.dev/en/criteria/0) passing criteria.*