# Knowledge Unit: Automated Environment Setup Scripts

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/automated-environment-setup-scripts
- **Maturity:** Maturing
- **Related Technologies:** Laravel Sail, Bash, Docker, Composer, Node.js, Makefile, Devcontainer

## Executive Summary

Automated environment setup scripts are executable procedures that provision a complete Laravel development environment with a single command, eliminating manual setup steps for new team members. These scripts handle prerequisites checking (Docker, PHP, Composer), project cloning, dependency installation (Composer, NPM), environment file creation (.env from .env.example), database creation and migration, key generation (APP_KEY), storage linking (storage:link), and IDE configuration. The goal is to reduce new developer onboarding from hours or days to minutes. Common implementations include Makefiles with targets (make setup), bash scripts (setup.sh), Sail's built-in initialization, and Devcontainer configurations that auto-provision the environment when VS Code opens. The most effective setup scripts are idempotent (can be run multiple times safely), provide clear progress feedback, and include validation checks with actionable error messages.

## Core Concepts

- **Single-Command Setup:** A single command (e.g., `make setup` or `bin/setup`) that performs all environment initialization; reduces onboarding friction and documents the setup process as executable code
- **Idempotency:** The script can be run multiple times without causing errors; already-completed steps are skipped or safely re-run
- **Prerequisite Verification:** The script checks that required tools (Docker, PHP, Composer, Node) are installed and meet minimum version requirements before proceeding
- **Environment File Management:** Automatic creation of .env from .env.example with sensible defaults; optional prompting for secrets (database passwords, API keys)
- **Database Bootstrapping:** Running migrations and seeders after the environment is ready; may include test database creation and sample data loading
- **Validation Check:** Post-setup verification that the application is running (HTTP health check, artisan command test)

## Mental Models

- **Setup Script as Onboarding Button:** Think of the setup script as a single "onboarding button" a new developer presses after cloning the repository—one command to go from zero to running application
- **Script as Executable Documentation:** The setup script is documentation that can't go out of date—it's tested on every new onboarding and CI run; README instructions can become stale, scripts always reflect the current requirements
- **Idempotent as Safe to Re-run:** Like `composer install` is safe to re-run (it's already installed, just verifies), a well-designed setup script never errors on a second run

## Internal Mechanics

1. **Prerequisite Check:** Script checks installed tool versions (docker --version, php --version, composer --version); exits with helpful error if requirements aren't met
2. **Dependency Check:** Verifies the project's composer.json and package.json dependencies are installable; suggests fixes for conflicting requirements
3. **Environment File Creation:** Checks for .env existence; if missing, copies .env.example, generates APP_KEY (php artisan key:generate), and prompts for service-specific secrets
4. **Container Provisioning:** If using Sail, runs `sail up -d` to start Docker containers; waits for MySQL/PostgreSQL health check before proceeding
5. **Database Initialization:** Runs `sail artisan migrate --seed` to create tables and populate initial data
6. **Storage and Cache Setup:** Runs `sail artisan storage:link`, `sail artisan optimize:clear`, and any project-specific setup commands
7. **Validation:** Performs a health check (HTTP request to the application, or `sail artisan about`) to confirm the environment is operational

## Patterns

- **Makefile Setup Pattern:**
  ```makefile
  .PHONY: setup
  setup: check-deps env-install db-setup validate

  .PHONY: check-deps
  check-deps:
      @command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }

  .PHONY: env-install
  env-install:
      cp -n .env.example .env || true
      composer install --ignore-platform-reqs
      sail up -d
      sail artisan key:generate
  ```
- **Bash Setup Script Pattern:**
  ```bash
  #!/bin/bash
  set -euo pipefail

  echo "Checking prerequisites..."
  command -v docker >/dev/null || { echo "Install Docker"; exit 1; }
  command -v composer >/dev/null || { echo "Install Composer"; exit 1; }

  echo "Setting up environment..."
  [ -f .env ] || cp .env.example .env
  composer install
  php artisan key:generate

  echo "Starting services..."
  ./vendor/bin/sail up -d
  ./vendor/bin/sail artisan migrate --seed

  echo "Setup complete! Visit http://localhost"
  ```
- **Devcontainer Pattern:**
  ```json
  {
    "name": "Laravel Dev",
    "dockerComposeFile": "docker-compose.yml",
    "service": "laravel.test",
    "workspaceFolder": "/var/www/html",
    "postCreateCommand": "composer install && cp -n .env.example .env && php artisan key:generate && php artisan migrate --seed"
  }
  ```
  The `postCreateCommand` runs automatically when VS Code opens the Devcontainer, providing zero-click setup.
- **Conditional Sailing Pattern:**
  ```bash
  if command -v sail &>/dev/null; then
    SAIL_CMD="sail"
  elif [ -f ./vendor/bin/sail ]; then
    SAIL_CMD="./vendor/bin/sail"
  else
    SAIL_CMD=""        # Fall back to native PHP
  fi
  ```
  Gracefully handles both Sail-provisioned and native environments.
- **Validation Pattern:**
  ```bash
  echo "Validating setup..."
  if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q 200; then
    echo "Application is running!"
  else
    echo "Application check failed. Check logs: docker compose logs"
  fi
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Script language | Bash vs Makefile vs PowerShell | Bash (universal in WSL2/macOS/Linux); Makefile as wrapper for dependency-ordered targets |
| Containerization | Sail vs Devcontainer vs native | Sail for teams; Devcontainer for VS Code users; native as fallback for lightweight environments |
| Database seeding | Full seed vs minimal vs skip | Default: migrate only (no seed) with --seed option; let developers choose based on task |
| Password management | Prompt vs env file defaults vs vault | .env.example with placeholder values; prompt for production-like secrets; document in 1Password for team |

## Tradeoffs

- **Script vs Manual Setup:** Scripts automate 90% of setup but fail when edge cases arise (unusual OS, proxy configurations). Manual setup offers full control but takes 30-60 minutes and has higher error rates for newcomers.
- **Sail vs Native Scripts:** Sail-based scripts guarantee environment consistency but add Docker overhead. Native scripts run faster but are prone to version mismatches across the team.
- **Full Automation vs Guided Steps:** Fully automated scripts (no prompts) are faster but may fail silently. Guided scripts with prompts and progress output are slower but more transparent and debuggable.

## Performance Considerations

- **Script Execution Time:** A full automated setup (including Docker image pull, composer install, migrations) takes 3-15 minutes on first run; subsequent runs are faster due to Docker cache and installed dependencies.
- **Network Dependencies:** Setup scripts depend on network access (Composer, NPM, Docker Hub); offline or VPN-restricted environments require caching strategies (Composer mirror, Docker registry mirror).
- **Disk Space:** Initial setup consumes 500MB-2GB for Docker images, vendor/, node_modules/, and storage/; communicate this in the script output to set expectations.

## Production Considerations

- **Development Only:** Automated setup scripts are for development environments; production provisioning uses different tools (Forge, Vapor, Ansible, Terraform).
- **CI Mirroring:** Use the same setup script in CI to verify it works; a green CI build on a fresh checkout proves the script is functional.
- **Security:** Never commit real secrets to setup scripts or .env.example. Use placeholders and instruct developers to obtain real secrets through a secure channel (password manager, vault).

## Common Mistakes

- **Non-idempotent operations:** Running `cp .env.example .env` without `-n` flag; overwrites existing .env with configuration changes, losing customizations
- **Hardcoded paths:** Using absolute paths that only work on one developer's machine; use relative paths and Sail's container abstraction
- **Missing error handling:** Script fails midway but prints no helpful error message; the developer is left guessing what went wrong
- **Ignoring OS differences:** Using Linux-specific commands (apt-get, systemctl) in a script that needs to work on macOS and Windows/WSL2
- **No validation step:** Script finishes without confirming the application actually works; developer thinks setup succeeded but the app fails to run

## Failure Modes

- **Docker Not Installed:** Script requires Docker but it's not installed. Mitigate: check for docker command early; print installation instructions for each platform.
- **Port Conflict:** Port 80/3306/6379 already in use. Mitigate: check port availability before starting containers; suggest APP_PORT/FORWARD_DB_PORT alternatives.
- **Composer Out of Memory:** composer install fails on memory-constrained environments. Mitigate: set COMPOSER_MEMORY_LIMIT=-1 in the script; suggest increasing Docker memory limit.
- **Database Connection Timeout:** MySQL container starts but isn't ready when migrations run. Mitigate: add a wait loop (`until docker compose exec mysql mysqladmin ping; do sleep 1; done`).
- **Invalid .env.example:** The .env.example is missing a required variable that a new developer needs to set. Mitigate: validate .env against a required keys list in the script.

## Ecosystem Usage

- **Laravel Sail:** The most common setup mechanism for new Laravel projects; sail:install script handles Docker provisioning
- **Laravel Forge:** Forge's provisioning scripts automate server setup for production; development setup scripts should mirror Forge's PHP/MySQL/Redis versions
- **Laravel Vapor:** Vapor projects use a different setup (serverless); setup scripts focus on local Lambda simulation via Docker
- **VS Code Devcontainers:** Auto-provisioning via devcontainer.json with postCreateCommand for zero-click onboarding

## Related Knowledge Units

- laravel-sail
- devcontainer-configuration
- environment-file-management
- wsl2-configuration-laravel
- local-environment-setup-documentation
- developer-onboarding-checklists

## Research Notes

- The "bin/setup" convention originated in the Rails community and has been adopted by many Laravel teams; it creates a predictable entry point across projects
- Laravel Shift provides project health checks that overlap with setup validation; consider using Shift's approach for post-setup verification
- Automated setup scripts reduce onboarding time by 60-80% according to team case studies; the largest time savings come from avoiding manual troubleshooting of environment-specific issues
- Many teams combine setup scripts with Docker Compose profiles (sail:install --devcontainer) for VS Code integration
