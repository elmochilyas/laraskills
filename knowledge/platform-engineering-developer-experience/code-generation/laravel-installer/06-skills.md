# Skill: Create New Laravel Projects with the Installer

## Purpose
Use the Laravel Installer CLI tool to quickly create new Laravel applications with interactive project configuration, starter kit installation, and database setup.

## When To Use
- Every new Laravel project — fastest path from terminal to new project
- Team onboarding — consistent project structure across the organization
- CI/GitHub Actions — automated project creation with `--no-interaction`

## When NOT To Use
- Existing projects (installer creates new projects only)
- Micro-services within a monorepo (use `composer create-project`)
- Projects requiring custom infrastructure beyond the installer's scope

## Prerequisites
- `laravel/installer` installed globally via Composer
- PHP 8.2+ installed
- Composer installed

## Inputs
- Terminal commands with flags

## Workflow

1. **Install/Update the Installer:** Run `composer global require laravel/installer` and ensure `~/.composer/vendor/bin` is in PATH. Keep updated with `composer global update laravel/installer`.

2. **Create New Project:** Run `laravel new project-name` for interactive mode. The wizard guides through starter kit, stack, testing framework, database, and Git initialization.

3. **Non-Interactive Mode (CI/Scripts):** Use `laravel new project-name --no-interaction` with explicit flags: `--stack=livewire`, `--pest`, `--git`, `--database=sqlite`.

4. **Choose Starter Kit:** Select `breeze` (auth scaffolding), `jetstream` (teams, 2FA), or `--no-starterkit` (API-only). Default is no starter kit.

5. **Configure Database:** Prefer SQLite for development (simplest setup). Select MySQL/PostgreSQL for production-matching environments.

6. **Use Custom Templates (Teams):** Add `--using=org/laravel-template` for organization-specific project skeletons. This standardizes project structure across the team.

7. **Initialize Git (Optional):** The installer can run `git init` and create an initial commit with the generated structure.

## Validation Checklist

- [ ] Installer updated to latest version
- [ ] New project creates without errors
- [ ] Starter kit installed and configured (if selected)
- [ ] NPM dependencies installed and built (for non-API projects)
- [ ] Database connection configured in `.env`
- [ ] Git initialized (if selected)
- [ ] Custom template applied (if using `--using`)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Outdated installer | Doesn't support latest Laravel version; run `composer global update` |
| PHP version mismatch | Installer fails; verify PHP 8.2+ |
| Interactive mode in CI | Pipeline hangs; use `--no-interaction` with all flags |

## Decision Points

- **Use for every new Laravel project** — Fastest path from terminal to new project
- **Use `composer create-project`** for micro-services within a monorepo
- **Custom templates** for team standards — `--using=org/laravel-template`

## Performance/Security Considerations

- **Global install:** Install globally via Composer, not per-project
- **Check PHP version** before creating project to ensure compatibility
- **Custom templates on GitHub** should follow Laravel skeleton structure

## Related Rules

- INSTALL-RULE-001: Keep the installer updated
- INSTALL-RULE-002: Use `--no-interaction` in CI
- INSTALL-RULE-004: Use custom templates for teams
- INSTALL-RULE-005: Prefer SQLite for development

## Related Skills

- Scaffold Laravel Authentication with Breeze
- Scaffold Laravel with Jetstream
- Choose Laravel Starter Kit

## Success Criteria

- New Laravel project created in under 2 minutes
- Starter kit, stack, and database configured correctly
- Team uses consistent project structure via custom templates
- CI workflows use non-interactive mode for automated setup
