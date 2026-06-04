# Skill: Configure Monorepo Dependency Management

## Purpose
Set up and maintain consistent dependency versioning across all packages in a Laravel monorepo, ensuring reproducible builds and preventing version conflicts.

## When To Use
- Managing a monorepo with 2+ packages sharing common dependencies (Laravel framework, PHP, common libraries)
- Enforcing single-version policy for shared dependencies
- Setting up root-level `composer.json` with path repositories
- Configuring CI validation for cross-package dependency consistency

## When NOT To Use
- Single-package repositories
- Packages have fundamentally incompatible dependency requirements (different Laravel major versions)
- Organization prefers per-package lock files and independent CI resolution
- Monorepo is a collection of unrelated packages with no shared dependencies

## Prerequisites
- `composer.json` for monorepo root and each package
- All packages using Composer for dependency management
- Understanding of Composer version constraints (`^`, `~`, `*`)
- Git repository with multiple package directories under `packages/`

## Inputs
- Root `composer.json` — declaring overall project dependencies and path repositories
- Per-package `composer.json` files — each defining package-specific dependencies
- `VERSIONS.md` — central document listing approved versions for shared dependencies
- CI configuration file (`.github/workflows/` or `.gitlab-ci.yml`)

## Workflow

1. **Establish Single Version Policy:** Define the approved PHP and Laravel version for all monorepo packages in a `VERSIONS.md` document. All packages must target the same major/minor versions of shared frameworks.

2. **Configure Root composer.json:** Set path repositories for all local packages using Composer's path repository type. Use the `replace` key to alias local packages. Add all shared dependencies at compatible version constraints.

3. **Align Per-Package Version Constraints:** Ensure every package's `composer.json` uses the same version constraint for shared dependencies (e.g., all require `laravel/framework: ^11.0`). Use automated search-and-replace scripts rather than manual updates.

4. **Commit Root composer.lock:** Generate and commit the root lock file. This ensures every developer and CI environment resolves identical dependency versions. Do not add `composer.lock` to `.gitignore`.

5. **CI-Validate Dependency Consistency:** In CI, run `composer validate`, `composer install --locked`, and `composer audit` at root level. Add a custom audit script to verify all packages use consistent versions of shared dependencies and that no circular inter-package dependencies exist.

6. **Automate Version Bumps:** Configure Renovate or Dependabot with monorepo-aware configuration that updates version constraints across all packages simultaneously when a shared dependency is updated.

7. **Handle Conflict Resolution:** When a version conflict arises, upgrade all packages to a compatible version. Use Composer's `replace` or alias features only as a last resort and document the decision in an Architecture Decision Record.

## Validation Checklist

- [ ] Root `composer.json` has path repositories for all local packages
- [ ] All packages use identical version constraints for shared dependencies
- [ ] Root `composer.lock` is committed and not in `.gitignore`
- [ ] CI pipeline validates dependency consistency across all packages
- [ ] No circular dependencies exist between packages
- [ ] Automated dependency update tooling is configured (Renovate/Dependabot)
- [ ] `VERSIONS.md` documents approved PHP, Laravel, and library versions

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Inconsistent dependency versions across packages | Root `composer install` fails with conflict |
| Missing root `composer.lock` | Different machines resolve different versions |
| Circular inter-package dependencies | Composer resolution fails; CI catches it |
| Version ranges too broad (`*`/`>=`) | Environments resolve incompatible versions |

## Decision Points

- **Single vs multi-version policy:** Use single version for framework/PHP; allow per-package versions for unrelated minor libraries
- **Root lock vs per-package locks:** Commit root `composer.lock`; maintain per-package lock files only in split repositories
- **Automated vs manual updates:** Prefer Renovate/Dependabot with monorepo-aware config; avoid manual per-package bumps
- **Conflict resolution:** Upgrade all packages to compatible version first; use `replace`/alias only as documented last resort

## Performance/Security Considerations

- **Composer resolution time:** 30-60s for 20-package monorepo with 100+ dependencies
- **Lock file size:** 2-5x larger than single-package lock; affects git operations slightly
- **Security scanning:** One `composer audit` at root covers all packages; centralized patching
- **License compliance:** Validate all dependency licenses across packages from a single root scan

## Related Rules

- DEP-RULE-001: Enforce single version policy
- DEP-RULE-002: Commit root composer.lock
- DEP-RULE-003: Automate version bumps across packages
- DEP-RULE-004: CI-validate dependency consistency
- DEP-RULE-005: Root composer.json with `replace` for local packages

## Related Skills

- Configure Path Repository Usage for Local Packages
- Optimize Monorepo CI Pipeline
- Extract Shared Libraries from Monorepo

## Success Criteria

- All monorepo packages resolve dependencies with a single `composer install` at root
- CI pipeline consistently validates cross-package dependency alignment
- No "works on my machine" issues from version drift across packages
- Security vulnerabilities detected once and patched across all packages
