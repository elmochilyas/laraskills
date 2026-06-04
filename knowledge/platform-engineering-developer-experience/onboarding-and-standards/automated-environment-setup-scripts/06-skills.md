# Skill: Create Automated Environment Setup Scripts

## Purpose
Provision a complete Laravel development environment with a single command, eliminating manual setup steps and reducing onboarding from hours to minutes.

## When To Use
- New team members join regularly and need to set up environments
- Setup involves multiple error-prone manual steps
- Team wants to eliminate "works on my machine" issues
- CI pipeline should mirror the development environment setup
- Project has complex service requirements (multiple databases, queues, caches)

## When NOT To Use
- Single developer who already has a working environment
- Project with trivial setup (git clone && composer install && php artisan serve)
- Organization has standardized managed dev machines with pre-installed tools

## Prerequisites
- Bash shell environment (Linux/macOS/WSL2)
- Docker and Docker Compose installed
- Composer and PHP installed locally
- Git installed
- Project repository with `.env.example` file

## Inputs
- Project repository URL
- List of required services (database, cache, queue)
- Environment variable template (`.env.example`)
- Minimum tool version requirements

## Workflow
1. Identify all required tools and services for the project
2. Create a `setup.sh` or `Makefile` with targets for each step
3. Add prerequisite verification at the top (fail fast with install instructions)
4. Step 1: Check prerequisites (Docker, PHP, Composer versions)
5. Step 2: Clone repository (or verify we're in the right directory)
6. Step 3: Create `.env` from `.env.example` using `cp -n` (idempotent)
7. Step 4: Run `composer install`
8. Step 5: Run `npm install && npm run build`
9. Step 6: Start containers (`sail up -d` or `docker compose up -d`)
10. Step 7: Generate APP_KEY (`php artisan key:generate`)
11. Step 8: Run migrations with optional `--seed`
12. Step 9: Validate the app (HTTP health check or `artisan about`)
13. Add the same script to CI to verify setup still works on every PR

## Validation Checklist
- [ ] Script can be run twice without errors (idempotent)
- [ ] Prerequisites checked before any destructive operations
- [ ] Clear progress output with section headers and timing
- [ ] Validation step confirms the app is actually working
- [ ] Platform-specific installation instructions for missing prerequisites
- [ ] `.env.example` has placeholder values (no real secrets)
- [ ] CI pipeline runs the same setup script on fresh checkout

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Script fails on second run | Not idempotent | Use `cp -n`, check-before-create patterns |
| `.env` overwritten | No protection | Use `cp -n .env.example .env` to not clobber |
| Prerequisite not installed | No validation | Add early fail with install instructions |
| Script works locally but not in CI | CI uses different environment | Run setup in CI on every PR |
| Docker not running | No check | Add `docker info` check before container start |
| Long seed times | Seed runs every time | Make `--seed` optional, migrate only by default |

## Decision Points
- **Script language:** Bash (universal) vs Makefile (dependency-ordered targets) vs both
- **Database seeding:** Seed by default or require explicit `--seed` flag
- **Container approach:** Laravel Sail vs raw Docker Compose vs Devcontainer
- **Validation method:** HTTP health check vs `artisan about` vs running test suite

## Performance/Security Considerations
- Never commit real secrets to `.env.example`; use placeholder values
- Document where to obtain real secrets (internal wiki, password manager)
- Idempotent scripts prevent accidental data loss on re-run
- Validate prerequisites early to avoid partial setup states
- Keep scripts in version control for audit trail

## Related Rules
- AUTOSETUP-RULE-001 through AUTOSETUP-RULE-012

## Related Skills
- Document Local Environment Setup
- Set Up Developer Onboarding Checklists
- Configure Devcontainer
- Set Up Laravel Sail

## Success Criteria
- New developer can run one command and have a working environment in <15 minutes
- Script passes CI verification on every PR
- Zero "works on my machine" issues reported during onboarding
- Platform-specific instructions cover macOS, WSL2, and Linux
- Troubleshooting section answers 90% of setup support questions
