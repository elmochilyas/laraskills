# Knowledge Unit: Local Environment Setup Documentation

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/local-environment-setup-documentation
- **Maturity:** Mature
- **Related Technologies:** Laravel Sail, Docker, Composer, Node.js, .env, Makefile

## Executive Summary

Local environment setup documentation provides step-by-step instructions for provisioning a Laravel development environment on a new machine. This documentation is the most critical piece of onboarding material—it answers the question "how do I get this application running on my computer?" Effective setup documentation covers: prerequisite tools (Docker, Git, Composer) with platform-specific installation links, repository cloning, automated setup script usage (make setup or bin/setup), environment file creation (.env from .env.example), database initialization (migrations, seeders), IDE configuration (VS Code extensions, PhpStorm settings), and verification steps (application health check, test run). The documentation is typically stored in the project README.md (setup section) or in a dedicated SETUP.md file. Best practice dictates that the setup documentation is tested on every release by running it against a clean environment in CI, ensuring instructions never become stale.

## Core Concepts

- **Single Source of Truth:** The setup documentation in the repository is the authoritative guide; any discrepancy between the doc and the actual process is a bug that must be fixed
- **Platform Coverage:** Instructions for macOS (most common), Windows/WSL2 (growing), and Linux (native); each platform has different Docker setup, filesystem considerations, and tool installation methods
- **Verification Step:** Each major setup section ends with a verification command (e.g., "Run `php artisan about` to confirm the application is configured correctly") to confirm the step succeeded
- **Troubleshooting Section:** A dedicated section addressing common setup failures (Docker not running, port conflicts, database connection refused, Composer memory limit) with actionable solutions
- **CI-Verified Instructions:** The setup documentation is executed by CI on every PR (fresh checkout, full setup, test run); if it fails, the documentation is out of date

## Mental Models

- **Setup Doc as Recipe Card:** The setup documentation is a recipe card—list of ingredients (prerequisites), step-by-step instructions (preparation), and verification (taste test). Anyone following the recipe should get the same result.
- **Setup Doc as Bug Report Filter:** A well-documented setup means 90% of environment issues are self-resolved; if a developer still can't set up, the troubleshooting section narrows down the problem before they ask for help.
- **READ ME First:** The setup section is literally the first thing a developer reads; it sets the tone for the entire project experience. A clear, working setup doc signals a well-maintained project.

## Internal Mechanics

1. **Prerequisite Check:** Lists required tools, minimum versions, and installation links; typically includes Docker Desktop, Git, Composer (or Sail handles PHP/Composer via Docker)
2. **Clone and Navigate:** Git clone command followed by cd into the project directory
3. **Dependency Installation:** `composer install` (with --ignore-platform-reqs if PHP version differs) and `npm install` if frontend assets are present
4. **Environment Configuration:** Copying .env.example to .env, generating APP_KEY, configuring database credentials for the local environment
5. **Database Setup:** Running migrations and seeders; optionally creating a dedicated database user
6. **Storage and Cache:** `php artisan storage:link`, `php artisan optimize:clear`, and any project-specific setup commands
7. **Application Verification:** Accessing the application in the browser (http://localhost or configured APP_PORT) and running the test suite to confirm everything works

## Patterns

- **README Setup Section Pattern:**
  ```markdown
  ## Quick Start

  ### Prerequisites
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (4.x+)
  - [Git](https://git-scm.com/) (2.x+)

  ### Setup
  git clone <repository-url>
  cd project-name

  cp .env.example .env
  composer install
  php artisan key:generate

  # Start Sail
  ./vendor/bin/sail up -d

  # Run migrations
  ./vendor/bin/sail artisan migrate --seed

  # Verify
  ./vendor/bin/sail artisan about
  # Visit http://localhost
  ```
- **Platform-Specific Tabs Pattern:**
  ```markdown
  ### macOS
  Install Docker Desktop for Mac, then follow Quick Start above.

  ### Windows (WSL2)
  1. Install WSL2 with Ubuntu: `wsl --install -d Ubuntu-24.04`
  2. Install Docker Desktop with WSL2 backend
  3. Clone the project inside WSL2: `cd ~ && mkdir projects && cd projects && git clone <url>`
  4. Follow Quick Start inside WSL2 terminal

  ### Linux (Ubuntu/Debian)
  Install Docker Engine via official Docker repository, then follow Quick Start above.
  ```
- **Troubleshooting Table Pattern:**
  ```markdown
  | Problem | Cause | Solution |
  |---------|-------|----------|
  | "Connection refused" on database | MySQL container not ready | Wait 10s, retry; check `sail logs mysql` |
  | Port 80 already in use | Another service on port 80 | Set `APP_PORT=8080` in .env |
  | Composer out of memory | Insufficient Docker memory | Increase Docker Desktop memory to 4GB |
  | "Class not found" after update | Autoload cache stale | Run `composer dump-autoload` |
  ```
- **One-Click Setup (Makefile) Pattern:**
  ```makefile
  setup:
      @echo "Setting up development environment..."
      cp -n .env.example .env || true
      @composer install
      @php artisan key:generate
      @./vendor/bin/sail up -d
      @./vendor/bin/sail artisan migrate --seed
      @echo "Setup complete! Visit http://localhost"
  ```
  The README then simply says: `make setup`.
- **CI-Verification Pattern:**
  ```yaml
  # .github/workflows/setup-test.yml
  - name: Test setup documentation
    run: |
      git clone <repo> /tmp/test-setup
      cd /tmp/test-setup
      cp .env.example .env
      composer install
      php artisan key:generate
      php artisan migrate --seed
      php artisan test
  ```
  This workflow run monthly or on changes to SETUP.md to ensure instructions are still valid.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Location | README.md vs SETUP.md vs CONTRIBUTING.md | README.md (setup section) for small projects; SETUP.md for detailed multi-platform instructions; CONTRIBUTING.md for contribution-specific setup |
| Automation level | Manual steps vs automated script | Automated script (make setup) with manual steps as documentation; script is the source of truth |
| Platform coverage | macOS only vs all three | macOS + WSL2 (covers 95% of Laravel developers); Linux as bonus |
| Verification | Manual check vs automated test | Both: manual check for immediate feedback; automated CI test for doc freshness |

## Tradeoffs

- **README vs Dedicated File:** README setup section is convenient (one file) but can make the README long. A dedicated SETUP.md keeps the README concise but adds another file for developers to find. Use README for basic setup (5-10 steps); SETUP.md for multi-platform instructions with troubleshooting.
- **Automated vs Manual Setup:** Automated scripts (make setup) are faster and more reliable but abstract away the steps, making debugging harder when something fails. Manual instructions are educational but error-prone. Best: automated script + annotated manual instructions.
- **Detailed vs Minimal:** Detailed instructions anticipate and solve every problem but are long and intimidating. Minimal instructions are quick to read but leave developers stuck on common issues. Use minimal Quick Start with a link to detailed instructions.

## Performance Considerations

- **Document Length:** A setup doc longer than 100 lines becomes hard to follow. Break into sections with clear headings; use collapsible sections for platform-specific details.
- **Screenshot Usage:** Avoid screenshots for setup instructions (they become outdated quickly when UIs change). Use text descriptions and commands that don't change.
- **Update Frequency:** Setup docs should be reviewed and tested on every major dependency update (PHP version change, Laravel upgrade, Sail update).

## Production Considerations

- **Security Warnings:** Include explicit warnings about never using the development setup commands (migrate:fresh, sail shell, xdebug) in production
- **Environment Isolation:** Document how the local environment differs from production (Docker vs Forge, APP_ENV=local vs production, debug mode enabled)
- **Production Access:** The setup doc should not include production credentials, API keys, or server addresses. Use .env.example with placeholder values.

## Common Mistakes

- **"It works on my machine" syndrome:** The setup doc was written by one person on one machine and doesn't account for platform differences; macOS instructions fail on Windows
- **Missing verification steps:** Instructions end with "setup complete" but no way to confirm; the developer thinks setup succeeded but the app doesn't run
- **Hardcoded credentials:** .env.example includes real database passwords or API keys that were accidentally committed
- **Outdated PHP version references:** Doc says "PHP 8.1 required" but the project now uses PHP 8.3; new developer installs wrong PHP version
- **No Docker prerequisite:** Instructions assume Docker is already installed and configured; developer without Docker experience gets stuck

## Failure Modes

- **Doc-Process Drift:** The setup documentation describes a process that no longer works (e.g., references artisan commands that were removed). Mitigate: CI-verified setup docs; run a fresh setup test on each release.
- **Platform Gap:** A developer on an unsupported platform (e.g., ARM Linux) encounters errors not covered in the documentation. Mitigate: document the supported platforms explicitly; provide a template for reporting platform-specific issues.
- **Assumed Knowledge:** Doc assumes the developer knows how to use Docker, configure environment variables, or troubleshoot database connections. Mitigate: link to external tutorials; include troubleshooting section.

## Ecosystem Usage

- **Laravel Sail:** Most setup docs now reference Sail (or Devcontainers) as the primary environment; the setup doc simply says "install Docker, then sail up"
- **Laravel Forge:** Forge provisioning scripts are referenced in setup docs for production parity information (PHP version, MySQL version)
- **Laravel Shift:** Setup doc may reference Shift for upgrading the project to a newer Laravel version; include the Shift URL and upgrade instructions
- **VS Code Devcontainers:** Projects with devcontainer.json can document "open in VS Code Devcontainer" as a one-click setup alternative

## Related Knowledge Units

- developer-onboarding-checklists
- automated-environment-setup-scripts
- environment-file-management
- contributing-dot-md-patterns
- laravel-sail

## Research Notes

- The README setup section is the most-viewed part of any repository; investing in clear setup instructions has the highest ROI of any documentation effort
- Laravel applications are increasingly distributed with Devcontainer configurations; the setup doc should present both Sail and Devcontainer options
- Setup documentation that includes a working automated script reduces first-PR time by an average of 60% compared to projects with manual-only instructions
- The Laravel ecosystem's reliance on Docker (via Sail) has simplified setup documentation significantly; a typical 2024 setup doc is 50% shorter than a 2020 pre-Sail doc
