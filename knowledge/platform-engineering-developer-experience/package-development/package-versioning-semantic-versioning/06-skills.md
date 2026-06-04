# Skill: Version a Laravel Package with Semantic Versioning

## Purpose
Apply strict semantic versioning to Laravel packages, ensuring MAJOR bumps only for breaking changes, MINOR for backward-compatible features, and PATCH for bug fixes, with proper Git tags and Composer constraints.

## When To Use
- Releasing a new version of a Laravel package
- Updating a package with breaking changes or new features
- Setting up versioning discipline for a new package

## When NOT To Use
- Internal projects with no external consumers (simpler versioning may suffice)
- Packages still in heavy development before 1.0.0 (0.x allows breaking changes without MAJOR bumps)

## Prerequisites
- Git repository with the package source
- composer.json with package name and initial version
- CHANGELOG.md file

## Inputs
- Current version
- List of changes since last release
- Whether changes include breaking API changes

## Workflow (numbered)
1. **Review changes** — Identify breaking changes (MAJOR), new features (MINOR), or bug fixes (PATCH)
2. **Update CHANGELOG.md** — Add entry with version number, release date, categorized changes (Added, Changed, Deprecated, Removed, Fixed, Security)
3. **Update composer.json version** — Set `"version"` field (or rely on Git tag, which Composer prefers)
4. **Tag the release** — `git tag v1.2.3 && git push origin v1.2.3`
5. **Verify on Packagist** — Confirm package resolves correctly with the new version
6. **Deprecate old APIs** — Add `@deprecated` annotations and migration guidance before removal in next MAJOR
7. **Document upgrade guide** — For MAJOR releases, provide migration guide in the release notes

## Validation Checklist
- [ ] Version follows MAJOR.MINOR.PATCH format
- [ ] Breaking changes only in MAJOR versions
- [ ] New features backward-compatible in MINOR versions
- [ ] Bug fixes backward-compatible in PATCH versions
- [ ] Git tag created and pushed
- [ ] CHANGELOG.md updated with categorized changes
- [ ] Version constraint in composer.json updated if needed
- [ ] `@deprecated` annotations added for upcoming removals
- [ ] composer.lock committed for consistent dev environments
- [ ] Migration guide included for MAJOR releases

## Common Failures
- **Breaking changes in MINOR/PATCH** — silently breaks consumer code; erodes trust
- **Not specifying Laravel/PHP constraints** — incompatible versions may be installed
- **Not tagging releases** — Composer can't resolve the version
- **Misusing ^ with pre-1.0 versions** — `^0.3` means `<0.4`, not `<1.0`
- **Not committing composer.lock** — inconsistent dev and CI environments

## Decision Points
- 0.x vs 1.0.0: stay in 0.x until public API stabilizes; 1.0.0 commits to SemVer
- Version alignment with Laravel: consider aligning package MAJOR with Laravel MAJOR for tightly coupled packages
- Pre-release tags: use `-alpha.1`, `-beta.2`, `-rc.1` for unstable releases

## Performance/Security Considerations
- Broad version constraints (`*`) slow Composer dependency resolution
- Thousands of Git tags can slow Git operations
- Pre-built distribution archives reduce install time vs Git cloning
- Security fixes: release as PATCH with minimal changes; delay detailed disclosure per responsible disclosure practices (30-90 days)
- YANK (abandon) versions with critical security issues on Packagist

## Related Rules (from 05-rules.md)
- SEMVER-RULE-001: Strict SemVer discipline
- SEMVER-RULE-002: Specify Laravel/PHP constraints
- SEMVER-RULE-003: Git tag every release
- SEMVER-RULE-004: Changelog-driven versioning
- SEMVER-RULE-005: Deprecate before removal
- SEMVER-RULE-013: Breaking changes in MINOR/PATCH (most common complaint)

## Related Skills
- Publish a Laravel Package to Private Packagist / Satis
- Automate Dependency Updates with Dependabot / Renovate
- Manage Laravel Version Upgrades with Shift / Rector

## Success Criteria
- Every release has a Git tag and CHANGELOG entry
- No breaking changes in MINOR/PATCH versions (verified by consumer feedback)
- Laravel/PHP constraints prevent installation on incompatible platforms
- Consumers can safely update PATCH versions without regressions
- Migration guides exist for all MAJOR version upgrades

---

# Skill: Publish a Laravel Package to Private Packagist / Satis

## Purpose
Set up a private Composer registry (Private Packagist or Satis) for distributing internal Laravel packages securely, with proper authentication and automated build processes.

## When To Use
- Organization has 3+ internal packages for private distribution
- Teams need to share packages without making them public on Packagist
- Air-gapped or compliance requirements demand self-hosted registry

## When NOT To Use
- 1-2 internal packages (path repositories may suffice)
- Open-source packages (public Packagist is appropriate)
- No infrastructure for hosting (prefer Private Packagist SaaS)

## Prerequisites
- Internal packages with composer.json and Git tags
- Private Packagist account or server for Satis hosting
- Web server or CDN for serving Satis output

## Inputs
- Package names and Git repository URLs
- Authentication method (API tokens, SSH keys, HTTP Basic)
- CI platform for automation

## Workflow (numbered)
1. **Choose registry type** — Private Packagist SaaS (features, easy) or Satis self-hosted (air-gapped, no cost)
2. **Configure composer.json** — Add `repositories` array in root projects with private registry listed first
3. **Set up authentication** — Create `auth.json` (add to `.gitignore`); use `COMPOSER_AUTH` in CI
4. **Configure package naming** — Use organizational prefix (e.g., `org-name/package-name`)
5. **Automate registry builds** — For Satis: CI builds on each package push; for Private Packagist: webhook integration
6. **Enable archive generation** — configure archive builds for fast `composer install` (avoids Git cloning)
7. **Test installation** — `composer require org-name/package-name` in a fresh Laravel project
8. **Document developer setup** — Instructions for authenticating with the private registry

## Validation Checklist
- [ ] Private registry listed first in `repositories` array
- [ ] `auth.json` in `.gitignore`; not committed
- [ ] `COMPOSER_AUTH` configured as CI secret
- [ ] Package names use organizational prefix
- [ ] Satis builds automated via CI; archives generated
- [ ] Registry access restricted with authentication
- [ ] `composer require` works from a fresh project
- [ ] Documentation exists for developer authentication setup
- [ ] API tokens rotated; expiry dates monitored

## Common Failures
- **Private registry listed after Packagist.org** — Composer finds public packages first; resolution conflicts
- **Committing auth.json** — credentials exposed to all repo users and present in Git history
- **Not building Satis on schedule** — stale package versions; consumers install outdated packages
- **Missing archive configuration** — Composer clones Git repos on each install; slow CI/CD

## Decision Points
- Private Packagist vs Satis: Private Packagist for most teams (SaaS, features); Satis for air-gapped (self-hosted, free)
- Auth method: API tokens for CI; SSH keys for developers; HTTP Basic for Satis
- Archive format: ZIP (default) vs TGZ; ZIP is more universally supported

## Performance/Security Considerations
- Private registry adds to `composer update` time; list first for fastest resolution
- Archive generation reduces install time significantly vs Git cloning
- CDN-serving for Satis output ensures availability; stale cache fallback prevents registry outages from blocking installs
- Dedicated CI users with minimum required permissions for registry access
- Token rotation schedule; monitor expiry dates to prevent CI failures
- Never commit credentials; use environment variables in CI

## Related Rules (from 05-rules.md)
- PRIVATE-RULE-001: List private registry first
- PRIVATE-RULE-002: auth.json outside version control
- PRIVATE-RULE-003: Organizational package prefix
- PRIVATE-RULE-004: Automate Satis builds
- PRIVATE-RULE-005: Private Packagist for features
- PRIVATE-RULE-007: Archive generation
- PRIVATE-RULE-009: Auth in CI securely

## Related Skills
- Version a Laravel Package with Semantic Versioning
- Scaffold a Laravel Package from the Standard Skeleton
- Configure Package Auto-Discovery

## Success Criteria
- Developers can `composer require` internal packages with zero friction
- Private registry resolves packages correctly (no naming conflicts with public packages)
- CI/CD pipelines install packages from the private registry without manual authentication steps
- Registry build automation ensures packages are always up to date
- Zero credential leaks from committed auth files
