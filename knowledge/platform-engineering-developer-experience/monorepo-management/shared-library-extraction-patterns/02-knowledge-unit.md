# Knowledge Unit: Shared Library Extraction Patterns

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/shared-library-extraction-patterns
- **Maturity:** Maturing
- **Related Technologies:** Composer, Laravel, PHP, Git, Refactoring

## Executive Summary

Shared library extraction is the process of identifying, isolating, and packaging reusable code from a Laravel application into standalone libraries that can be consumed by multiple projects. The extraction typically starts with a "discovery phase" (identifying code used across multiple applications), followed by "extraction" (moving code to a new package with its own tests and documentation), and ends with "consumption" (replacing the original code with the package dependency). For Laravel teams with multiple applications, shared libraries typically cover: DTOs, service layer classes, model traits, notification templates, custom validation rules, Artisan commands, and UI components. The key challenge is balancing extraction timing—extract too early and the API isn't stable; extract too late and you have duplicated code across projects.

## Core Concepts

- **Extraction Threshold:** The point at which code duplication or cross-project inconsistency justifies creating a shared library; commonly the "rule of three" (three usages before extraction)
- **Seed Project:** The original project where the shared code was developed; extraction should not break the seed project's existing functionality
- **Extraction Boundary:** Determining what belongs in the shared library vs. what stays in the application; shared libraries contain domain-independent code (infrastructure, cross-cutting concerns), not business logic
- **Versioned API Contract:** The extracted library has a public API that multiple applications depend on; changes must follow SemVer and be backward-compatible

## Mental Models

- **Extraction as Refactoring:** The extraction process is a large-scale refactoring that changes the code structure without changing behavior. The extracted package should work identically to the inlined code.
- **Library as an API Contract:** Once extracted, the shared library has a defined API; applications depend on this API, and changing it requires coordination across all consuming projects
- **Extraction as Paying Down Technical Debt:** Duplicated code is a form of debt; extraction is the repayment. Each extraction reduces future maintenance cost but requires immediate investment.
- **Seed Project as First Customer:** The project where the code originated is the library's first customer; its needs drive the library API design

## Internal Mechanics

1. **Discovery Phase:** Scan application code for patterns: repeated classes, service providers, model traits, helpers, and commands across multiple projects. Use static analysis to detect exact code duplication and near-duplication.
2. **Extraction Phase:** Create a new package directory in the monorepo (or new repository), move the source code, create `composer.json` with dependencies, set up autoloading, configure Pint/phpstan, create initial tests, and write documentation.
3. **Integration Phase:** In the seed project, replace the original files with `composer require` of the new package; update imports, service provider registrations, and configuration. Run full test suite to verify no breakage.
4. **Consumption Phase:** Update all other consuming projects to use the shared package; remove duplicated code; verify each project's tests pass.
5. **Deprecation Phase:** After all projects consume the library, the original inlined code can be removed. Some teams maintain backward-compatible aliases for one release cycle.

## Patterns

- **Strangler Fig Pattern:** Gradually replace inlined code with package dependencies over time; don't try to extract everything at once. Each extraction is an independent PR that removes duplication and adds a package dependency.
- **Seed-First Extraction Pattern:** Extract the library while it's still in active development in the seed project; refine the API through actual usage before promoting to a stable release.
- **API Surface Minimization Pattern:** Expose the minimum public API needed by consumers; keep implementation details private. This reduces the maintenance burden of backward compatibility.
- **Dependency Inversion Pattern:** Instead of extracting the concrete implementation, extract the interface/contract into a shared library; each application provides its own implementation. This works well for service classes with different implementations.
- **Gradual Extraction Pattern:** Start with the most stable, most-shared code (DTOs, value objects, traits) and extract outward to less-shared code (service classes, commands, controllers). Stable code makes better library contracts.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Extraction timing | Early (before duplication exists) vs Late (3+ usages) | After 2-3 usages; early extraction risks unstable API |
| Package granularity | Many small packages vs few large packages | Few large packages for initial extraction; split later if needed |
| Monorepo location | `packages/shared/` vs separate repository | `packages/shared/` for monorepo; separate repo if consumed outside the monorepo |
| API stability | Strict SemVer vs "prefer stable" | Strict SemVer once library reaches 1.0; experimental before 1.0 |
| Code ownership | Shared ownership vs dedicated team | Shared ownership for infrastructure libraries; dedicated team for domain libraries |

## Tradeoffs

- **Early vs Late Extraction:** Early extraction gives more time to stabilize the API but may result in unnecessary abstraction (YAGNI). Late extraction is more certain but allows more duplication to accumulate.
- **Fine-Grained vs Coarse-Grained Libraries:** Many small libraries (DTOs, helpers, models) provide precise versioning but increase dependency management overhead. Fewer large libraries simplify dependency management but may couple unrelated functionality.
- **Shared Sources vs Shared Binaries:** Shared source (Copied between projects) is simple but diverges over time. Shared binaries (Composer packages) ensure consistency but require version management and coordinated updates.
- **Monorepo vs Multi-Repo Libraries:** Monorepo shared libraries are easier to develop and refactor together but harder to distribute independently. Multi-repo libraries are easier to publish independently but harder to develop cross-library changes.

## Performance Considerations

- **Extraction Overhead:** The extraction process itself (creating the package, moving code, updating imports) is time-consuming. Budget 2-5 days per significant extraction, including testing and migration.
- **Composer Resolution Impact:** Each shared library adds to `composer install/update` time. 10+ shared libraries increase resolution time by 10-30 seconds.
- **Test Suite Growth:** Shared libraries add their own test suites; total test time increases but the tests are reusable across projects (write once, test everywhere).
- **Autoloading Overhead:** Each additional package adds to Composer's classmap generation time. In production with `composer dump-autoload -o`, the overhead is negligible.

## Production Considerations

- **Backward Compatibility:** Once a shared library is used by multiple production applications, breaking changes require coordinated deployment across all consuming applications. Establish a deprecation policy: deprecate in MINOR version, remove in next MAJOR.
- **Library Governance:** Define who can create and publish shared libraries, what quality standards they must meet (tests, documentation, CI), and how they are versioned. Without governance, the library portfolio becomes unmaintainable.
- **Migration Path:** When extracting code, provide a migration guide for consuming projects. Include before/after code examples, configuration changes, and upgrade scripts if applicable.
- **Documentation:** Each shared library should have README with: purpose, installation, configuration, basic usage, and migration guide (for >1.0 versions).

## Common Mistakes

- **Extracting to a separate package too early:** The API changes twice in the first month, creating churn for the first consumer; wait until the code is stable
- **Over-abstracting during extraction:** Creating interfaces, factories, and configuration for code that had none; extracted libraries should be as simple as the inlined code was
- **Not maintaining backward compatibility:** Extracted library changes its public API in a patch version, breaking the consuming application; follow SemVer strictly
- **Forgetting to extract tests:** The inlined code had tests, but the extracted package doesn't; always migrate tests alongside the production code
- **Extracting business logic:** Shared libraries should contain technical infrastructure, not business logic; business logic varies by application and is harder to share

## Failure Modes

- **Extracted Library Abandonment:** Library is extracted but lacks a maintainer; bugs accumulate, security patches are delayed, and consuming projects stop using it. Mitigate: assign at least two maintainers per library.
- **API Instability:** Frequent API changes frustrate consumers; they pin to a specific version and never upgrade. Mitigate: stabilize API before 1.0; use `@internal` annotations for non-API classes.
- **Divergent Evolution:** Consuming projects develop divergent requirements; the library becomes a lowest-common-denominator that satisfies no one. Mitigate: consider library splitting or providing extension points.
- **Extraction Regret:** Library is extracted but only has one consumer; the added complexity of package management wasn't worth it. Mitigate: wait for 2-3 consumers before extraction.

## Ecosystem Usage

- **Laravel Framework:** Laravel itself composed of shared libraries (illuminate/*); demonstrates the value of stable, well-documented shared libraries
- **Spatie Packages:** Spatie's approach of independent packages for each concern (media-library, permissions, tags, etc.) shows the fine-grained library pattern
- **Large Laravel Shops:** Organizations with 10+ Laravel applications typically maintain 3-15 internal shared libraries covering DTOs, validation, notifications, and infrastructure concerns
- **Skeleton for Shared Libraries:** Many organizations maintain an internal "library skeleton" based on Spatie's package skeleton for extracting code

## Related Knowledge Units

- laravel-monorepo-tools
- composer-path-repository-usage
- dependency-management-across-monorepo
- package-skeleton-structure

## Research Notes

- The "rule of three" (duplicate detection threshold) originated in the refactoring community and is the most common extraction trigger in Laravel teams
- Successful shared library extraction correlates strongly with: clear API contracts, comprehensive test suites, and dedicated maintenance resources
- The most commonly extracted shared libraries in Laravel organizations are: DTOs/value objects, custom validation rules, notification classes, and Artisan commands
- Teams that skip the "discovery phase" (systematically scanning for duplication) tend to extract the wrong code first, reducing the ROI of the extraction effort
