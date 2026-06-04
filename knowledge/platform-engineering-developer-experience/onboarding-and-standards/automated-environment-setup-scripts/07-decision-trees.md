# Decision Trees: Automated Environment Setup Scripts

## Metadata
- **KU ID:** onboarding-team-standards/automated-environment-setup-scripts
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Automation approach | Makefile / Bash script / Devcontainer / Sail built-in | Team platform, complexity, and Docker dependency |
| 2 | Script language | Bash / PowerShell / Makefile | Target OS and team familiarity |
| 3 | Containerization strategy | Sail-only / Docker Compose / Native | Service requirements and team Docker experience |
| 4 | Idempotency strategy | Safe re-run / Fresh each time / Partial skip | How the script behaves on subsequent runs |
| 5 | Database seeding approach | Migrate only / Migrate + seed / Skip with flag | First-run vs development iteration needs |

## Architecture-Level Decision Trees

### Tree 1: Choosing the Automation Approach

- **Start:** You need to automate environment setup
- **Does the team use VS Code with Devcontainers?**
  - Yes → Use Devcontainer configuration. Provides zero-click setup. Pair with a Makefile wrapper for non-VS Code users.
  - No → Continue.
- **Does the project use Laravel Sail?**
  - Yes → Use Sail's built-in setup (`sail up -d`). Add a Makefile wrapper with `make setup` for prerequisite checks and validation.
  - No → Continue.
- **Does the project require multiple services (MySQL, Redis, Mailpit)?**
  - Yes → Use Docker Compose directly. Create a `setup.sh` script that checks Docker, starts containers, installs dependencies, and runs migrations.
  - No → Use a lightweight bash script (`setup.sh`) for prerequisite checks, Composer install, .env creation, and `php artisan serve`.

### Tree 2: Script Language and Platform Selection

- **Start:** You need to write the setup script
- **Is the team primarily Windows-based?**
  - Yes → Use PowerShell for native Windows support. Supplement with Sail for Docker abstraction.
  - No → Continue.
- **Is the team macOS or Linux based?**
  - Yes → Use Bash. Universal in WSL2/macOS/Linux. Pair with a Makefile as a wrapper for dependency-ordered targets.
  - No → Use Bash as default. Makefile covers 95% of Laravel development environments.
- **Does the team use WSL2?**
  - Yes → Bash scripts inside WSL2. Ensure the script detects WSL2 and adjusts paths accordingly.

### Tree 3: Setup Script Structure and Validation

- **Start:** Designing the setup script flow
- **Are all prerequisites installed (Docker, Composer)?**
  - No → Exit with error. Print platform-specific installation instructions for each missing prerequisite. Provide direct download links.
  - Yes → Continue.
- **Does .env exist?**
  - No → Create .env from .env.example with `cp -n`. Generate APP_KEY. Prompt for override values (database, mail).
  - Yes → Skip .env creation. Proceed to dependency installation.
- **Install dependencies:** composer install + npm install. Run in parallel where possible.
- **Start containers:** `sail up -d` or Docker Compose up.
- **Run database setup:** Migrate with `--seed` flag (optional). Default to migrate only.
- **Validate setup:** HTTP health check (curl localhost returns 200) or `artisan about`. Print success or failure with next steps.

### Tree 4: CI Integration Strategy

- **Start:** You want to keep the setup script working
- **Does CI run on every PR?**
  - Yes → Run the setup script in CI on every PR. Verifies it works. If CI fails, the script is broken and must be fixed.
  - No → Continue.
- **Is there a scheduled CI pipeline?**
  - Yes → Run setup script weekly in CI to catch dependency drift.
  - No → Run setup script manually from a fresh checkout before every release. Document this as a release step.
- **Does the script use remote dependencies (Docker images, Composer)?**
  - Yes → Also run a CI variant that validates remote dependency resolution. Use Composer mirror and Docker registry mirror for offline/VPN-restricted environments.
  - No → Standard CI validation is sufficient.
