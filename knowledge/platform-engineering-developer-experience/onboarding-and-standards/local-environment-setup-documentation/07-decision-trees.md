# Decision Trees: Local Environment Setup Documentation

## Metadata
- **KU ID:** onboarding-team-standards/local-environment-setup-documentation
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Document location | README.md / SETUP.md / CONTRIBUTING.md | Project size and complexity of setup |
| 2 | Platform coverage | macOS only / macOS + WSL2 / All platforms | Team composition and development OS |
| 3 | Automation alongside docs | Automated script + manual steps / Manual only / Script only | Trade-off between reliability and educational value |
| 4 | Platform-specific handling | Collapsible sections / Separate files / Tabs | Organization and readability of cross-platform instructions |
| 5 | CI verification strategy | Per-release test / Per-PR test / Manual periodic test | Keeping setup instructions from becoming stale |

## Architecture-Level Decision Trees

### Tree 1: Document Location and Detail Level

- **Start:** Deciding where to put setup documentation
- **Is the project a simple package or open-source library?**
  - Yes → Include setup in README.md. Keep to 10-15 lines (clone, install, configure, run tests).
  - No → Continue.
- **Is the project a Laravel application with multiple services?**
  - Yes → Continue.
  - No → README.md with setup section is sufficient.
- **Is the setup documentation longer than 100 lines?**
  - Yes → Use SETUP.md for detailed instructions. Keep a 5-10 line Quick Start in README.md. Link to SETUP.md from README.md.
  - No → Include in README.md setup section.
- **Is there a CONTRIBUTING.md?**
  - Yes → CONTRIBUTING.md links to SETUP.md for development setup. Avoid duplicating setup instructions.
  - No → Fine to use README.md setup section.

### Tree 2: Platform Coverage Decision

- **Start:** Which platforms to document
- **What OS do team members use?**
  - Analyze team survey data. Ask during onboarding what OS they use.
- **macOS use >= 80%?**
  - Yes → Document macOS with detailed steps. Add WSL2 section for minority users. Omit Linux desktop unless requested.
  - No → Continue.
- **WSL2 use >= 30%?**
  - Yes → Document macOS + WSL2 as primary platforms. Add Linux as bonus section. This covers 95% of Laravel developers.
  - No → Document macOS with WSL2 notes. macOS covers the majority; WSL2 covers fast-growing Windows segment.
- **Each platform section includes:**
  - Prerequisites with platform-specific installation commands and links.
  - Verification command for each major step.
  - Known platform-specific issues and workarounds.

### Tree 3: Automation vs Manual Approach

- **Start:** How to balance script automation with documentation
- **Does an automated setup script exist?**
  - Yes → Provide the script alongside manual steps. Script is faster and more reliable. Manual steps are educational.
  - No → Consider creating one. If not feasible, document manual steps with verification at each stage.
- **Strategy:**
  - Quick Start section uses the automated script: `make setup` or `bin/setup`.
  - Detailed section breaks down what the script does step by step.
  - This teaches the developer what's happening and helps them debug when the script fails.
- **CI verification:** Run the automated script from a fresh checkout in CI on every release. If CI fails, the documentation is out of date.

### Tree 4: Troubleshooting and Verification

- **Start:** Building the troubleshooting section
- **What are the most common setup failures?**
  - Collect data from recent onboarding experiences and team support questions.
- **Common Laravel setup issues:**
  - Port conflicts (80, 3306, 6379 already in use)
  - Database connection refused (MySQL container not ready)
  - Composer out of memory (Docker memory limit)
  - Class not found (autoload cache stale)
  - Wrong PHP version (Sail container vs host mismatch)
- **Troubleshooting format:** Table with Problem, Cause, Solution columns. Use real error messages as problem entries.
- **Verification after each major step:**
  - "Install Docker" → `docker run hello-world`
  - "Start Sail" → `sail artisan about`
  - "Run migrations" → `sail artisan migrate:status`
  - "App running" → HTTP health check on localhost
- **CI-verify documentation:** Run setup steps from fresh checkout in CI. Schedule on every release or at least quarterly.
