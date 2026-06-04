# Experience Curation: Local Environment Setup Documentation

## Metadata
- **KU ID:** onboarding-team-standards/local-environment-setup-documentation
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** developer-onboarding-checklists, automated-environment-setup-scripts, environment-file-management
- **Related Technologies:** Laravel Sail, Docker, Composer, Node.js, .env, Makefile
- **Target Audience:** Laravel developers, new team members, open-source contributors

## Overview

Local environment setup documentation provides step-by-step instructions for provisioning a Laravel development environment on a new machine. This is the most critical piece of onboarding material—it answers "how do I get this application running on my computer?" Effective setup documentation covers: prerequisite tools (Docker, Git, Composer) with platform-specific installation links, repository cloning, automated setup script usage, environment file creation (.env from .env.example), database initialization, IDE configuration, and verification steps. The documentation is stored in the project README or SETUP.md and should be CI-verified on every release.

## Core Concepts

- **Single Source of Truth:** The setup documentation in the repository is the authoritative guide; any discrepancy is a bug
- **Platform Coverage:** Instructions for macOS, Windows/WSL2, and Linux with platform-specific steps
- **Verification Step:** Each major section ends with a verification command to confirm success
- **Troubleshooting Section:** Dedicated section addressing common setup failures with actionable solutions
- **CI-Verified Instructions:** Setup documentation executed by CI on fresh checkout to ensure instructions are always valid

## When To Use

- Any Laravel project with more than one developer
- Open-source Laravel packages or applications
- Internal projects where new team members join periodically
- Projects with non-trivial setup requirements (Docker, services, environment variables)

## When NOT To Use

- Single-developer project with trivial setup (SQLite, no Docker)
- Project is a prototype with no plans for additional contributors
- Setup is fully automated with zero-config (e.g., Vapor dev environment)

## Best Practices (WHY)

1. **CI-Verify Setup Instructions (Why):** Run the setup steps from a fresh checkout in CI on every release. If CI fails, the documentation is out of date. This is the only reliable way to prevent "it works on my machine" syndrome from infecting the documentation.

2. **Provide an Automated Script Alongside Manual Steps (Why):** An automated script (`make setup` or `bin/setup`) is faster and more reliable, but manual steps are educational—they teach the developer what the script does and help them debug when something goes wrong. Provide both.

3. **Cover All Major Platforms (Why):** macOS is the most common, but Windows/WSL2 is growing fast and Linux is essential for some teams. A setup doc that only covers macOS leaves Windows and Linux developers stuck. Use platform tabs or collapsible sections.

4. **Include Troubleshooting Before It's Needed (Why):** Developers hit the same issues (port conflicts, database connection refused, Composer out of memory). Document common problems with solutions before developers ask for help. A good troubleshooting section eliminates 90% of setup support questions.

5. **Verification After Each Major Step (Why):** "Install Docker" without "Verify: `docker run hello-world` succeeds" means the developer may think Docker is installed when it's not functional. Each major step should have a verification command that confirms the step completed correctly.

## Architecture Guidelines

- **Location:** README.md (setup section) for small projects; SETUP.md for detailed multi-platform instructions. CONTRIBUTING.md for contribution-specific setup.
- **Automation Level:** Automated script (`make setup`) as source of truth; manual steps as annotated documentation.
- **Platform Coverage:** macOS + WSL2 (covers 95% of Laravel developers). Linux as bonus.
- **Verification:** Manual check for immediate feedback; automated CI test for doc freshness.
- **Structure:** Prerequisites → Quick Start → Platform-Specific → Verification → Troubleshooting.
- **Quick Start:** Minimal 5-10 line guide. Detailed instructions can be in collapsible sections or a separate file.

## Performance

- **Document Length:** Under 100 lines for Quick Start. Break into sections with clear headings.
- **Screenshots:** Avoid screenshots (become outdated when UIs change). Use text descriptions and commands.
- **Update Frequency:** Review and test on every major dependency update (PHP version, Laravel upgrade, Sail update).

## Security

- **Security Warnings:** Include explicit warnings about never using development commands (`migrate:fresh`, `sail shell`) in production.
- **Environment Isolation:** Document how local environment differs from production (APP_ENV=local, debug mode enabled, different services).
- **No Production Secrets:** Setup doc must not include production credentials, API keys, or server addresses.
- **.env.example:** Use placeholder values only. Never commit real secrets.

## Common Mistakes

### Mistake 1: "It Works on My Machine"
- **Description:** Setup doc written by one person on one machine, doesn't account for platform differences
- **Cause:** No cross-platform testing
- **Consequence:** macOS instructions fail on Windows, developer gets stuck
- **Better:** Test on all major platforms. Document known platform differences.

### Mistake 2: Missing Verification Steps
- **Description:** Instructions end with "setup complete" but no way to confirm
- **Cause:** Assuming setup always succeeds
- **Consequence:** Developer thinks setup succeeded but the app doesn't run
- **Better:** End each major section with a verification command

### Mistake 3: Hardcoded Credentials in .env.example
- **Description:** .env.example includes real database passwords or API keys
- **Cause:** Convenience during initial documentation creation
- **Consequence:** Security incident when committed to public repository
- **Better:** Use placeholder values only. Document where to get real values.

### Mistake 4: Outdated PHP Version References
- **Description:** Doc says "PHP 8.1 required" but project uses PHP 8.3
- **Cause:** Not updated after dependency upgrades
- **Consequence:** Developer installs wrong PHP version
- **Better:** CI-verify setup docs; update alongside dependency changes

## Anti-Patterns

- **The One-Paragraph Setup:** "Install Docker and run sail up." Too minimal, no troubleshooting. First-time Docker users will be stuck. Provide prerequisites, verification, and troubleshooting.
- **The Mac-Only Guide:** Instructions assume macOS. Windows/WSL2 and Linux developers are left to figure it out themselves. Cover all major platforms.
- **The Outdated Screenshot Guide:** Annotated screenshots from a previous UI version. The UI changed, now the instructions are misleading. Use text commands instead.
- **The Untested Setup Guide:** Documentation that hasn't been tested since it was written. Every step may be wrong. CI-verify on every release.

## Examples

### Example 1: Quick Start Section
```markdown
## Quick Start
```bash
git clone <repository-url>
cd project-name

cp .env.example .env
composer install
php artisan key:generate

./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed

# Verify
./vendor/bin/sail artisan about
# Visit http://localhost
```
```

### Example 2: Troubleshooting Table
```markdown
| Problem | Cause | Solution |
|---------|-------|----------|
| "Connection refused" on database | MySQL container not ready | Wait 10s, retry; check `sail logs mysql` |
| Port 80 already in use | Another service on port 80 | Set `APP_PORT=8080` in .env |
| Composer out of memory | Insufficient Docker memory | Increase Docker Desktop memory to 4GB |
| "Class not found" after update | Autoload cache stale | Run `composer dump-autoload` |
```

## Related Topics

- **developer-onboarding-checklists:** Setup doc as part of onboarding checklist
- **automated-environment-setup-scripts:** Script that automates the documented steps
- **environment-file-management:** .env file configuration patterns
- **contributing-dot-md-patterns:** CONTRIBUTING.md includes setup section
- **laravel-sail:** Docker-based environment reference

## AI Agent Notes

- **Context Requirements:** When advising on setup documentation, first determine the project's environment tooling (Sail vs Docker Compose vs native), target platforms (macOS, Windows, Linux), and common setup issues reported by recent hires.
- **Key Decision Points:** Location (README vs SETUP.md), automation level (script + manual vs manual only), platform coverage (which platforms to support), verification approach.
- **Common Pitfalls in AI Assist:** Don't assume Docker is installed. Always include verification steps. Cover at least macOS and WSL2. CI-verify instructions. Don't use screenshots.
- **Laravel-Specific Nuances:** Most Laravel projects now use Sail, which simplifies setup docs. A 2025 setup doc is ~50% shorter than a 2020 pre-Sail doc. Devcontainer support is growing as a one-click alternative.

## Verification
- [ ] KU accurately defines local setup documentation patterns
- [ ] Core concepts cover platform coverage, verification, troubleshooting
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize CI verification and troubleshooting
- [ ] Architecture guidelines cover location, automation, structure
- [ ] Performance addresses doc length and screenshot avoidance
- [ ] Security covers credentials and production warnings
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify Mac-only guide and untested guide
- [ ] Examples show Quick Start and troubleshooting table
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address Laravel-specific setup patterns
