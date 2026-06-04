# Skill: Evaluate and Remediate Third-Party Package Octane Compatibility

## Purpose
Systematically evaluate every installed third-party package for Octane compatibility, classify on the compatibility spectrum, and create shim layers for incompatible packages.

## When To Use
- Pre-Octane deployment: evaluate every installed package
- Adding new packages to an Octane application
- Upgrading packages (minor/patch can introduce new singletons)
- Debugging unexpected Octane behavior from packages

## When NOT To Use
- PHP-FPM only (package incompatibility invisible)
- Well-known compatible packages (Laravel first-party)
- Packages with explicit Octane documentation

## Prerequisites
- `composer.json` with all installed packages
- Codebase access to vendor directory
- Understanding of singleton state leaks and static property accumulation
- Octane running in staging environment for testing

## Inputs
- Output of `composer show --tree` (all direct and transitive dependencies)
- List of package service providers
- Target Octane runtime (Swoole/RoadRunner/FrankenPHP)

## Workflow
1. Run `composer show --tree` to enumerate all installed packages and their dependencies
2. For each package, inspect its service provider's `register()` and `boot()` for `singleton()`, `instance()`, and static property mutations
3. Grep vendor code for static property assignments, `$_SERVER`/`$_ENV` access, and `register_shutdown_function()` usage
4. Test each package with 100+ sequential requests in the same Octane worker — compare response outputs for data contamination across requests
5. Classify each package on compatibility spectrum: Fully Compatible, Compatible with Hooks, Partially Compatible, Incompatible
6. Create shim layer for incompatible packages: `RequestTerminated` cleanup listeners, scoped overrides, or feature-flag gating
7. Document every package, version, compatibility status, required shim, and last-audit date in a living compatibility matrix

## Validation Checklist
- [ ] All packages (direct and transitive) enumerated from `composer show --tree`
- [ ] Each package's service provider inspected for `singleton()` with mutable state
- [ ] Vendor code grepped for static property accumulation patterns
- [ ] Sequential 100+ request test passes for each package — no data contamination
- [ ] Shim layer created for each incompatible package using `RequestTerminated` listeners or scoped overrides
- [ ] Compatibility matrix documented with package name, version, status, shim, last-audit date

## Common Failures
- Assuming "works in PHP-FPM = works in Octane" — most common and dangerous assumption
- Testing with a single request — Octane bugs need 2+ requests to manifest
- Patching vendor directory directly — overwritten on `composer update`
- Confusing "no errors" with "compatible" — silent data corruption produces wrong results without exceptions
- Ignoring transitive dependencies — package's dependency may be the one leaking
- Not re-auditing after minor/patch updates — new singleton binding introduced

## Decision Points
- Shim vs fork: always prefer shim (RequestTerminated listener or scoped override) — forks require manual merging of upstream changes
- Feature-flag gating vs full disable: if only some features are incompatible, gate them behind `app()->bound(Octane::class)` check
- Runtime-specific compatibility: may be compatible with RoadRunner (process isolation) but not Swoole (coroutine sharing)

## Performance Considerations
- Shim layers add ~0.5-3ms per request
- Reflection-based static clearing is slower than direct method calls
- Scoped overrides add normal scoped overhead (~1ms per binding per request)
- Heavy cleanup in `RequestTerminated` delays next request's sandbox creation
- Sequential 100+ request testing adds CI time but is essential for catching leaks

## Security Considerations
- Silent incompatibility: package appears to work but produces subtly wrong results
- Partial feature breakage: some features work, others silently fail
- Version-specific compatibility: compatible in v1.2, breaks in v1.3 — CI must flag version changes
- Runtime-specific compatibility: process isolation in RoadRunner masks leaks that appear in Swoole

## Related Rules
- Audit every installed package for Octane compatibility before deployment (05-rules.md)
- Create shim layers over package forks (05-rules.md)
- Test packages with >=100 sequential requests (05-rules.md)
- Maintain a living package compatibility matrix (05-rules.md)
- Re-audit package compatibility after every update (05-rules.md)
- Use feature-flag gating for partially compatible packages (05-rules.md)

## Related Skills
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)
- Identify Singleton State Leaks (singleton-state-leaks)
- Identify Static Property Accumulation (static-property-accumulation)
- Generate Service Binding Inventory (service-binding-audit)

## Success Criteria
- Every installed package has a documented compatibility classification
- Incompatible packages have application-side shims (not forks)
- 100+ sequential request test passes for every package without data contamination
- Compatibility matrix is version-controlled and updated on every package change
- CI blocks merge if a package version change requires re-audit that hasn't occurred
- Partially compatible packages use feature-flag gating for incompatible features only
