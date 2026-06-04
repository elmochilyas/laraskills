# Skill: Set Up a Laravel Monorepo with symplify/monorepo-split

## Purpose
Create a monorepo containing multiple Laravel packages with independent versioning, change-detection CI, and automated split testing for individual package distribution.

## When To Use
- Multiple closely related Laravel packages that change together frequently
- Team wants atomic commits across packages
- Need consistent tooling, CI, and code standards across packages

## When NOT To Use
- Packages are unrelated and rarely change together
- Different packages need different Laravel/PHP versions
- Team unfamiliar with Git subtree operations and monorepo tooling

## Prerequisites
- Composer installed globally
- Git repository for the monorepo
- Individual repositories for each split package
- CI platform (GitHub Actions, GitLab CI)

## Inputs
- Package directory layout plan
- Package names and their corresponding split repository URLs
- PHP/Laravel version requirements per package

## Workflow (numbered)
1. **Structure directories** — Create `/packages/{package-name}` for each package; each has own `composer.json`, tests, source
2. **Configure root composer.json** — Require all packages with `*` version; use `replace` for local packages; add path repos for `packages/*`
3. **Set up monorepo-builder.php** — Define `package_directories`, `data_to_append`, and `directories_to_repositories` mappings
4. **Implement change-detection CI** — Use `dorny/paths-filter` or equivalent to test only changed packages and their dependents
5. **Automate split on tags** — Configure CI to split packages when tag convention `{package-name}/{version}` is pushed
6. **Enforce acyclic deps in CI** — Add automated validation that no circular package dependencies exist
7. **Establish release process** — Tag in monorepo → CI validates → CI splits → Split repos update → Packagist publication

## Validation Checklist
- [ ] `/packages/{package-name}` structure with independent composer.json per package
- [ ] Root composer.json has path repos and `replace` declarations
- [ ] `monorepo-builder.php` configured with directory-to-repo mappings
- [ ] Change-detection CI filters packages correctly
- [ ] Tag-based split automation works end to end
- [ ] No circular package dependencies
- [ ] Split repos are updated correctly on tag push

## Common Failures
- **Not using path repos in development** — slow cross-package feedback loop
- **Circular package dependencies** — Composer resolution fails, split operations break
- **Oversized monorepo** — including unrelated projects; slow clones
- **Forgetting to split before release** — split repos outdated; consumers can't install

## Decision Points
- Package granularity: fewer larger packages (less split overhead) vs more smaller packages (better isolation)
- Split trigger: tag-based (intentional) vs commit-based (frequent but noisy)
- Versioning scheme: shared root version vs independent per-package versions

## Performance/Security Considerations
- Without change detection, CI runs all tests on every commit (10-50x slower)
- Use deploy keys or scoped tokens per split repository; store as CI secrets
- All monorepo changes go through PR review; split repos are derived artifacts
- Never commit directly to split repos

## Related Rules (from 05-rules.md)
- MONOTOOL-RULE-001: Use Composer path repos for development
- MONOTOOL-RULE-002: Implement change-detection testing
- MONOTOOL-RULE-003: Automate splits on tags
- MONOTOOL-RULE-004: Enforce acyclic package dependencies
- MONOTOOL-RULE-008: CI pipeline
- MONOTOOL-RULE-009: Release process

## Related Skills
- Configure Composer Path Repositories for Monorepos
- Extract Shared Libraries from Laravel Applications
- Manage Dependencies Across a Laravel Monorepo

## Success Criteria
- Monorepo CI runs in < 10 minutes by testing only changed packages
- Split repositories update automatically on tag push
- All packages can be independently versioned and released
- No circular dependencies detected in CI
- Developers can make cross-package changes in a single commit

---

# Skill: Configure Composer Path Repositories for Monorepos

## Purpose
Set up Composer path repositories in a Laravel monorepo to enable real-time feedback during cross-package development with local symlinks.

## When To Use
- Developing multiple interdependent Laravel packages in a monorepo
- Testing a package change against a real application before publishing
- Need real-time feedback for cross-package changes

## When NOT To Use
- Single package development with no cross-package dependencies
- Production or CI environments (remote resolution required)
- Windows without admin privileges (symlink issues)

## Prerequisites
- Monorepo with `packages/` directory
- Root composer.json

## Inputs
- Package directory structure
- Version constraints for each local package

## Workflow (numbered)
1. **Add path repository to root composer.json** — `"repositories": [{"type": "path", "url": "packages/*"}]` with relative path
2. **Require local packages** — `"require": {"my-org/package-a": "*", "my-org/package-b": "*"}`
3. **Add replace declarations** — `"replace": {"my-org/package-a": "self.version"}` prevents downloading from remote
4. **Test symlink** — Run `composer install`; verify symlink in `vendor/my-org/package-a`
5. **Handle lock file portability** — Regenerate lock in CI or use `COMPOSER_ROOT_VERSION`
6. **Configure CI validation** — Add CI job that resolves without path repos to catch remote resolution issues

## Validation Checklist
- [ ] Path repo uses relative path in root composer.json
- [ ] Local packages required with `*` version constraint
- [ ] `replace` declarations prevent remote download
- [ ] Symlinks created correctly in vendor directory
- [ ] CI job validates remote resolution without path repos
- [ ] Production build strips path repo configuration

## Common Failures
- **Committing path repo lock file to production** — `composer install` fails with path not found
- **Not using path repos in development** — developers manually symlink or run composer update repeatedly
- **Version constraint mismatch** — local version doesn't match constraint; update local package version

## Decision Points
- Symlink vs copy: symlink for development (instant feedback); copy if Windows without admin
- Lock file strategy: regenerate in CI vs environment-specific lock files
- Validation depth: basic (no path repo) vs comprehensive (mock remote Packagist)

## Performance/Security Considerations
- Path repos give instant feedback — edit local package, see changes immediately
- Lock file with path repos is not portable across machines
- Path-referenced packages may expose source code; ensure no credentials or secrets
- Strip path repo configuration for production builds

## Related Rules (from 05-rules.md)
- PATH-RULE-001: Use relative paths
- PATH-RULE-002: Never commit path repos to production
- PATH-RULE-003: Use * version constraint
- PATH-RULE-004: Validate with remote resolution in CI
- PATH-RULE-006: Repository definition
- PATH-RULE-014: Avoid production path repos

## Related Skills
- Set Up a Laravel Monorepo with symplify/monorepo-split
- Extract Shared Libraries from Laravel Applications
- Manage Dependencies Across a Laravel Monorepo

## Success Criteria
- Cross-package changes visible in real-time via symlinks
- `composer install` in CI resolves from path repos correctly
- Separate CI job validates remote resolution without path repos
- Production builds resolve from remote repositories only
- Lock file is portable or regenerated per environment

---

# Skill: Extract Shared Libraries from Laravel Applications

## Purpose
Identify duplicated code across Laravel applications and extract it into a shared, versioned package following the rule-of-three principle, with tests, minimized public API, and a documented migration path.

## When To Use
- Same or similar code exists in 2+ Laravel applications
- Organization wants consistent implementations of cross-cutting concerns
- Repeated patterns (traits, helpers, commands) found across projects
- Code is stable and not expected to change frequently

## When NOT To Use
- Code still evolving rapidly
- Only one application uses the code
- Code implements business logic specific to one application
- No resources to maintain shared library long-term

## Prerequisites
- Multiple Laravel applications with duplicated code
- Private Composer registry (Private Packagist or Satis)
- Composer path repository for local development

## Inputs
- List of candidate code for extraction
- Consuming applications and their repository URLs
- API surface requirements

## Workflow (numbered)
1. **Discover** — Scan applications for repeated patterns using static analysis; look for exact and near-duplicates
2. **Evaluate** — Apply rule of three: extract after code found in at least 3 places
3. **Create package** — Use `spatie/package-skeleton-laravel` to scaffold the library in `packages/shared/`; include composer.json, autoloading, tests
4. **Extract code + tests** — Move source files and their tests into the package; verify all tests pass
5. **Minimize public API** — Mark internals as `@internal` or private; expose minimum needed by consumers
6. **Integrate in first app** — Replace inlined code with `composer require` of new package; run full test suite
7. **Document migration path** — Before/after code examples, config changes, upgrade scripts
8. **Repeat for remaining apps** — Strangler Fig pattern: gradually replace inlined code across all consumers
9. **Deprecate original code** — After all consumers migrate, remove original inlined code

## Validation Checklist
- [ ] Rule of three satisfied (3+ usages before extraction)
- [ ] Package created with composer.json, autoloading, pint, phpstan, tests
- [ ] All original tests migrated and passing
- [ ] Public API minimized; internals marked `@internal`
- [ ] First consumer integrated and test suite passes
- [ ] Migration guide documented with before/after examples
- [ ] Original code removed or deprecated after all consumers migrate

## Common Failures
- **Extracting too early** — API changes multiple times; churn for consumers
- **Over-abstracting** — adding interfaces and factories the original code didn't have
- **Not maintaining backward compatibility** — changing public API in patch versions
- **Forgetting to extract tests** — untrusted library with no regression protection
- **Grand unified library** — one massive package with everything; tightly coupled

## Decision Points
- Extraction timing: wait for 2-3 independent usages; extract based on concrete patterns, not predictions
- Package granularity: start coarser, split later; DTOs + validation in one package is fine initially
- Monorepo vs separate repo: monorepo for closely related packages; separate repo for independent distribution

## Performance/Security Considerations
- Shared library vulnerability affects all consuming applications; scan regularly
- Keep shared lib in private Composer repository; never publish internal code publicly
- Extracted library should be as simple as inlined code was — don't over-engineer during extraction
- Follow SemVer strictly; extracted library has a public API consumers depend on

## Related Rules (from 05-rules.md)
- EXTRACT-RULE-001: Apply the rule of three
- EXTRACT-RULE-002: Extract tests with code
- EXTRACT-RULE-003: Minimize public API
- EXTRACT-RULE-004: Extract technical infrastructure, not business logic
- EXTRACT-RULE-005: Document the migration path
- EXTRACT-RULE-015: Extracting too early
- EXTRACT-RULE-016: Over-abstracting during extraction

## Related Skills
- Set Up a Laravel Monorepo with symplify/monorepo-split
- Configure Composer Path Repositories for Monorepos
- Scaffold a Laravel Package from the Standard Skeleton

## Success Criteria
- Duplicated code eliminated from all consuming applications
- Shared library has passing tests, documentation, and migration guide
- All consumers migrated within planned timeline
- Zero incidents from shared library changes (SemVer compliance)
- Library maintainer assigned with clear ownership
