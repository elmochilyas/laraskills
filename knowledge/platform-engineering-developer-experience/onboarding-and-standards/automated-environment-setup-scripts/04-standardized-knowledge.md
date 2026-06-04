# Experience Curation: Automated Environment Setup Scripts

## Metadata
- **KU ID:** onboarding-team-standards/automated-environment-setup-scripts
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** laravel-sail, devcontainer-configuration, environment-file-management
- **Related Technologies:** Laravel Sail, Bash, Docker, Composer, Node.js, Makefile, Devcontainer
- **Target Audience:** Laravel developers, DevOps engineers, team leads

## Overview

Automated environment setup scripts are executable procedures that provision a complete Laravel development environment with a single command, eliminating manual setup steps for new team members. These scripts handle prerequisites checking (Docker, PHP, Composer), project cloning, dependency installation (Composer, NPM), environment file creation (.env from .env.example), database creation and migration, key generation (APP_KEY), storage linking, and IDE configuration. The goal is to reduce new developer onboarding from hours or days to minutes. Common implementations include Makefiles (`make setup`), bash scripts (`setup.sh`), Sail's built-in initialization, and Devcontainer configurations.

## Core Concepts

- **Single-Command Setup:** One command that performs all environment initialization; reduces onboarding friction
- **Idempotency:** The script can be run multiple times without causing errors; completed steps are skipped or safely re-run
- **Prerequisite Verification:** Checks that required tools are installed and meet minimum version requirements before proceeding
- **Environment File Management:** Automatic .env creation from .env.example with sensible defaults
- **Database Bootstrapping:** Running migrations and seeders after the environment is ready
- **Validation Check:** Post-setup verification that the application is running (HTTP health check, artisan command test)

## When To Use

- New team members join regularly and need to set up environments
- Setup involves multiple steps (Docker, Composer, database, migrations) that are error-prone manually
- Team wants to eliminate "works on my machine" issues by standardizing the setup process
- CI pipeline should mirror the development environment setup
- Project has complex service requirements (multiple databases, queues, caches)

## When NOT To Use

- Single developer who already has a working environment
- Project with trivial setup (git clone && composer install && php artisan serve)
- Team prefers to understand each setup step manually (learning opportunity for new developers)
- Organization has a standardized developer environment (e.g., managed dev machines with pre-installed tools)

## Best Practices (WHY)

1. **Make Scripts Idempotent (Why):** A non-idempotent script that fails on second run is frustrating. Use `cp -n` (no clobber) for .env creation, check-before-create patterns, and safe re-runs. The developer should be able to run the script confidently, even if setup was partially completed before.

2. **Validate Prerequisites Early (Why):** Fail fast with helpful error messages if Docker or Composer isn't installed. Don't let the developer run through 10 steps before discovering they're missing a fundamental tool. Print platform-specific installation instructions for each missing prerequisite.

3. **Provide Clear Progress Output (Why):** Developers need to know what the script is doing and how long it will take. Print section headers, progress indicators, and time estimates. If a step fails, print a clear error message with next steps.

4. **Include a Validation Step (Why):** The script should end by confirming the application is actually working—HTTP health check, `artisan about` output, or a test suite run. Without validation, the developer thinks setup succeeded when the app doesn't run.

5. **Use the Same Script in CI (Why):** Running the setup script in CI on every PR verifies that it still works. If CI fails, the script is broken and must be fixed. This is the only reliable way to prevent script drift.

## Architecture Guidelines

- **Script Language:** Bash (universal in WSL2/macOS/Linux). Makefile as wrapper for dependency-ordered targets. PowerShell for Windows-native teams.
- **Containerization:** Sail for most teams (Docker-based consistency). Devcontainer for VS Code users (zero-click setup). Native as fallback for lightweight environments.
- **Database Seeding:** Default: migrate only (no seed) with `--seed` option. Let developers choose based on task. Seed times can be long.
- **Secret Management:** .env.example with placeholder values. Prompt for production-like secrets. Document where to obtain real secrets (1Password, vault).
- **Structure:** check-deps → env-setup → deps-install → containers-up → db-setup → validate. Each step is a named function for clarity.

## Performance

- **Script Execution Time:** 3-15 minutes on first run (Docker image pull, composer install, migrations). Subsequent runs faster due to caching.
- **Network Dependencies:** Scripts depend on network access (Composer, NPM, Docker Hub). For offline/VPN-restricted environments, provide caching strategies (Composer mirror, Docker registry mirror).
- **Disk Space:** Initial setup consumes 500MB-2GB (Docker images, vendor/, node_modules/). Communicate this in script output.
- **Parallel Steps:** Where possible, run independent steps in parallel (e.g., Docker pull + composer install).

## Security

- **Development Only:** Scripts are for development environments only. Production uses different tools (Forge, Vapor, Ansible, Terraform).
- **No Secrets in Scripts:** Never commit real secrets to setup scripts. Use placeholders and obtain real secrets through secure channels.
- **CI Verification:** Run setup script in CI to verify it works; also run a variant that validates remote dependency resolution.
- **Port Management:** Check port availability before starting containers. Suggest alternative ports for common conflicts (80, 3306, 6379).

## Common Mistakes

### Mistake 1: Non-Idempotent Operations
- **Description:** `cp .env.example .env` without `-n` flag overwrites existing .env
- **Cause:** Not considering that the script may be run multiple times
- **Consequence:** Developer loses .env customizations on re-run
- **Better:** Use `cp -n` (no clobber) or check for .env existence before copying

### Mistake 2: Hardcoded Paths
- **Description:** Using absolute paths that only work on one developer's machine
- **Cause:** Testing only on own machine, not considering team diversity
- **Consequence:** Script fails for everyone else
- **Better:** Use relative paths and Sail's container abstraction

### Mistake 3: Missing Error Handling
- **Description:** Script fails midway but prints no helpful error message
- **Cause:** No error handling, assuming everything succeeds
- **Consequence:** Developer is left guessing what went wrong
- **Better:** Use `set -euo pipefail` (bash); print clear error messages with next steps

### Mistake 4: No Validation Step
- **Description:** Script finishes without confirming the application works
- **Cause:** Focusing on execution, not outcome
- **Consequence:** Developer thinks setup succeeded but the app fails to run
- **Better:** End with HTTP health check or `artisan about` verification

## Anti-Patterns

- **The Silent Script:** Zero output during execution. Developer doesn't know if it's working or stuck. Provide progress output at each step.
- **The Fragile Script:** Any minor deviation (different OS, different Docker version) causes failure. Use fallbacks and platform detection.
- **The Monolith Script:** One giant 500-line script doing everything. Hard to debug, hard to modify. Break into modular functions.
- **The Untested Script:** Script exists but hasn't been run on a fresh machine in 6 months. CI-verify on every PR or at least weekly.
- **The Manual-Equivalent Script:** Script that requires the developer to answer 10 prompts. The point is automation—sensible defaults with override options.

## Examples

### Example 1: Makefile Setup
```makefile
.PHONY: setup
setup: check-deps env-install db-setup validate

.PHONY: check-deps
check-deps:
	@command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
	@docker info >/dev/null 2>&1 || { echo "Docker not running"; exit 1; }

.PHONY: env-install
env-install:
	cp -n .env.example .env || true
	composer install --ignore-platform-reqs
	sail up -d
	sail artisan key:generate

.PHONY: validate
validate:
	@curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q 200 \
		&& echo "Setup complete!" \
		|| echo "Validation failed, check logs"
```

### Example 2: Bash Setup Script Structure
```bash
#!/bin/bash
set -euo pipefail

echo "=== Checking prerequisites ==="
check_docker
check_composer

echo "=== Setting up environment ==="
setup_env_file
install_dependencies

echo "=== Starting services ==="
start_containers
run_migrations

echo "=== Validating setup ==="
health_check

echo "✓ Setup complete! Visit http://localhost"
```

## Related Topics

- **laravel-sail:** Docker-based environment tool
- **devcontainer-configuration:** VS Code auto-provisioning
- **environment-file-management:** .env file patterns
- **local-environment-setup-documentation:** Documentation for the setup script
- **developer-onboarding-checklists:** Setup script in onboarding context
- **wsl2-configuration-laravel:** Windows-specific setup patterns

## AI Agent Notes

- **Context Requirements:** When advising on setup scripts, first determine the team's OS distribution (macOS, Windows/WSL2, Linux), Docker experience level, and existing Sail/Devcontainer usage.
- **Key Decision Points:** Script language (Bash vs Makefile), containerization (Sail vs Devcontainer vs native), seeding strategy, prerequisite checking approach.
- **Common Pitfalls in AI Assist:** Make scripts idempotent. Include prerequisite checks. Provide progress output. End with validation. CI-verify the script.
- **Laravel-Specific Nuances:** Sail is the most common development environment. Devcontainer integration is growing. The `bin/setup` convention originated in Rails and has been adopted by many Laravel teams.

## Verification
- [ ] KU accurately defines automated setup scripts
- [ ] Core concepts cover idempotency, prerequisites, validation
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize idempotency and CI verification
- [ ] Architecture guidelines cover language, containerization, secrets
- [ ] Performance addresses execution time and disk space
- [ ] Security covers development-only usage and CI verification
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify silent script and fragile script
- [ ] Examples show Makefile and bash script patterns
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
