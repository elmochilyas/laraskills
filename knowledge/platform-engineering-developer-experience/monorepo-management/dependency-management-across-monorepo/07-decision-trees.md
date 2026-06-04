# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Dependency Management Across Monorepo
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Single version policy vs per-package versions? | Dependency sharing, coordination | Single version for shared deps; per-package for isolated libs |
| 2 | Commit root composer.lock or not? | Reproducibility, path repo confusion | Commit root composer.lock; validate with CI |

---

# Architecture-Level Decision Trees

---

## Decision 1: Single Version Policy vs Per-Package Versions?

---

## Decision Context

Shared dependencies (Laravel framework, PHP) must have consistent versions across all monorepo packages. Minor libraries with unrelated purposes can have per-package versions. The choice affects coordination overhead.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the dependency a core framework/PHP version shared by all packages?
↓
YES → **Single version policy** — all packages must use compatible versions
NO → ↓
Do multiple packages depend on this library with the same version need?
↓
YES → Single version recommended to avoid resolution conflicts
NO → ↓
Can packages evolve independently with different versions of this dependency?
↓
YES → Per-package versioning is acceptable
NO → Enforce single version; document rationale
Regardless:
- Document approved versions in a central `VERSIONS.md`
- Automate version bumps across packages (Renovate/Dependabot)
- CI validates version alignment across all packages

---

## Rationale

Single version for core dependencies prevents resolution failures and ensures consistent behavior. Per-package versions for isolated libraries give teams autonomy. The key is identifying which dependencies are truly shared vs package-specific.

---

## Recommended Default

**Default:** Single version for framework/PHP; per-package for isolated libraries
**Reason:** Core consistency with maximum flexibility for non-shared dependencies

---

## Risks Of Wrong Choice

- **Per-package for framework:** Resolving incompatible versions breaks root install
- **Single for everything:** Slow, coordinated version bumps for unrelated libraries

---

## Related Rules

- GP-RULE-006: Path definition
- GP-RULE-007: Multi-channel discovery

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

---

## Decision 2: Commit Root composer.lock or Not?

---

## Decision Context

The root `composer.lock` in a monorepo with path repositories is controversial — path repos add local paths to the lock file, making it non-portable. However, not committing the lock file causes inconsistent resolution.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the monorepo use path repositories?
↓
YES → Commit root `composer.lock`; add CI job that validates remote resolution
NO → **Commit root composer.lock** — standard best practice
Regardless:
- The lock file ensures reproducible builds across developer machines
- Path repo entries in lock file are replaced on each `composer install`
- CI validates: `composer install --locked` succeeds
- Add separate CI job testing remote-only resolution (without path repos)
- Never add `composer.lock` to `.gitignore`

---

## Rationale

The root `composer.lock` ensures consistent dependency resolution across developers and CI. Path repositories do add some non-portable entries, but the lock file still provides value for shared dependencies. CI validation catches resolution issues before they affect developers.

---

## Recommended Default

**Default:** Commit root composer.lock with CI validation of remote resolution
**Reason:** Reproducible builds; CI catches path repo lock file issues

---

## Risks Of Wrong Choice

- **Not committing lock file:** Different developers resolve different versions; "works on my machine" bugs
- **Committing without CI validation:** Broken lock file blocks all developers; long debugging sessions

---

## Related Rules

- GP-RULE-008: Path feedback loop
- GP-RULE-009: Path versioning

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

