# Rules: Dependency Management Across Monorepo

## Metadata
- **Source KU:** dependency-management-across-monorepo
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DEP-RULE-001: **Enforce single version policy** — For shared dependencies (Laravel framework, PHP), enforce one version across all monorepo packages.
- DEP-RULE-002: **Commit root composer.lock** — Ensures reproducible builds across dev machines and CI. Without it, "works on my machine" issues arise.
- DEP-RULE-003: **Automate version bumps across packages** — When updating a shared dependency, update ALL packages simultaneously. Manual per-package updates miss some.
- DEP-RULE-004: **CI-validate dependency consistency** — Validate all packages use consistent versions, no circular deps, lock file is current.

## Architecture Rules
- DEP-RULE-005: **Root composer.json** — Requires all packages' dependencies at compatible versions. Uses `replace` for local packages.
- DEP-RULE-006: **Dependency update process** — Automated PRs (Renovate/Dependabot) with monorepo-aware config that updates all packages simultaneously.
- DEP-RULE-007: **Conflict resolution** — When version conflict arises, upgrade all packages to compatible version. Use `replace` or alias only as last resort.
- DEP-RULE-008: **Lock file strategy** — Single root `composer.lock` committed. Per-package lock files in split repositories.

## Security Rules
- DEP-RULE-009: **Centralized scanning** — One `composer.lock` scan covers all packages. Vulnerability detected once, patched for all.
- DEP-RULE-010: **Run composer audit at root** — Check for known vulnerabilities across all packages from a single command.

## Common Mistakes
- DEP-RULE-011: **Inconsistent dependency versions** — Package A requires `^10.0`, Package B requires `^11.0`. Root install fails.
- DEP-RULE-012: **Not committing root composer.lock** — Inconsistent dependency resolution across machines.
- DEP-RULE-013: **Circular inter-package dependencies** — A depends on B, B depends on A. Composer cannot resolve.
- DEP-RULE-014: **Version ranges too broad** — Using `*` or `>=`. Different environments resolve different versions.

## Anti-Pattern Rules
- DEP-RULE-015: **Avoid version free-for-all** — Each package uses whatever version it wants. Root install constantly fails.
- DEP-RULE-016: **Avoid frozen lock file** — `composer.lock` never updated. Dependencies accumulate security vulnerabilities.
- DEP-RULE-017: **Avoid ignored conflict** — Removing conflicting package from monorepo rather than aligning versions.
- DEP-RULE-018: **Avoid manual bump** — Engineer manually updates 12 packages, misses 2. Monorepo breaks. Automate.
