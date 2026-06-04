# Experience Curation: Shared Library Extraction Patterns

## Metadata
- **KU ID:** monorepo-management/shared-library-extraction-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** laravel-monorepo-tools, composer-path-repository-usage, dependency-management-across-monorepo
- **Related Technologies:** Composer, Laravel, PHP, Git, Refactoring
- **Target Audience:** Laravel developers, software architects, platform engineers

## Overview

Shared library extraction is the process of identifying, isolating, and packaging reusable code from a Laravel application into standalone libraries consumed by multiple projects. The extraction follows a phased approach: discovery (identifying duplicated code), extraction (moving code to a new package with tests and documentation), and consumption (replacing original code with the package dependency). For Laravel teams with multiple applications, shared libraries typically cover: DTOs, service layer classes, model traits, notification templates, custom validation rules, Artisan commands, and UI components. The key challenge is balancing extraction timing—extract too early and the API is unstable; extract too late and duplicated code accumulates across projects.

## Core Concepts

- **Extraction Threshold:** The point at which code duplication justifies creating a shared library; commonly the "rule of three" (three usages before extraction)
- **Seed Project:** The original project where shared code was developed; extraction must not break it
- **Extraction Boundary:** Determining what belongs in the shared library vs what stays in the application; shared libraries contain infrastructure and cross-cutting concerns, not business logic
- **Versioned API Contract:** The extracted library has a public API that multiple applications depend on; changes must follow SemVer
- **Strangler Fig Pattern:** Gradually replacing inlined code with package dependencies over time
- **API Surface Minimization:** Exposing the minimum public API needed by consumers; keeping implementation details private

## When To Use

- Same code (or very similar) exists in 2+ Laravel applications
- Organization wants to enforce consistent implementations of cross-cutting concerns
- Team notices repeated patterns (traits, helpers, commands) across projects
- Code is stable and not expected to change frequently
- There is commitment to maintain the shared library long-term

## When NOT To Use

- Code is still evolving rapidly — wait for the API to stabilize
- Only one application uses the code — extraction adds complexity without benefit
- Code implements business logic specific to one application — it won't generalize
- Organization lacks resources to maintain shared libraries
- Extracted library would have only one consumer

## Best Practices (WHY)

1. **Apply the Rule of Three (Why):** Extract after the code is used in at least three places. Early extraction risks creating abstractions that don't fit real use cases. Three usages provide enough pattern confidence to design a stable API.

2. **Extract Tests with Code (Why):) The inlined code had tests, and those tests must migrate with the extraction. Without tests, the extracted library is untrusted. Teams will be hesitant to update it or rely on it. Always move tests alongside the source code.

3. **Minimize the Public API (Why):** Expose only what other packages need. Mark everything else `@internal` or use private visibility. A large public API is a large backward-compatibility surface. Each public method is a promise you must keep.

4. **Extract Technical Infrastructure, Not Business Logic (Why):** Shared libraries should contain technical infrastructure (validation rules, DTOs, traits, helpers, commands). Business logic varies by application and is harder to share. When business logic diverges, the library becomes a lowest-common-denominator that satisfies no one.

5. **Document the Migration Path (Why):** Every extraction should include a migration guide for consuming projects. Include before/after code examples, configuration changes, and upgrade scripts. Without a migration guide, teams will delay adoption.

## Architecture Guidelines

- **Discovery Phase:** Scan application code for repeated patterns using static analysis. Look for exact duplicates and near-duplicates (similar structure with minor variations).
- **Extraction Phase:** Create package in `packages/shared/` (for monorepo) or new repository (for external consumption). Include `composer.json`, autoloading, Pint/phpstan config, tests, and README.
- **Integration Phase:** Replace original code with `composer require` of new package. Update imports, service provider registrations, and configuration. Run full test suite to verify no breakage.
- **Deprecation Phase:** After all consumers migrate, remove original inlined code. Maintain backward-compatible aliases for one release cycle if needed.
- **Package Granularity:** Start with coarser packages and split later if needed. DTOs + validation rules in one package is fine initially; split when they have different release cadences.
- **Monorepo vs Separate Repo:** Monorepo packages are easier to develop together. Separate repos are needed if consumers exist outside the monorepo.

## Performance

- **Extraction Overhead:** Budget 2-5 days per significant extraction including testing and migration.
- **Composer Resolution Impact:** Each shared library adds to `composer install/update` time. 10+ libraries add 10-30 seconds.
- **Test Suite Growth:** Shared libraries add their own tests but enable write-once-test-everywhere efficiency.
- **Autoloading Overhead:** Each package adds to classmap generation time. With optimized autoloading (`dump-autoload -o`), overhead is negligible.

## Security

- **Dependency Scanning:** Scan all shared libraries for vulnerable dependencies. A vulnerability in a shared library affects all consuming applications.
- **Access Control:** Internal shared libraries should be in a private Composer repository (Private Packagist, Satis). Never publish internal libraries to public Packagist.
- **Code Review:** All extractions go through code review. Review focuses on: API design, test coverage, security implications, and backward compatibility.
- **Supply Chain:** Sign shared library releases. Verify package integrity before installation.

## Common Mistakes

### Mistake 1: Extracting Too Early
- **Description:** Creating a shared library before the code pattern is stable
- **Cause:** Eagerness to share code, underestimating API stability importance
- **Consequence:** API changes multiple times in first month, churn for consumers
- **Better:** Wait for 2-3 independent usages before extraction

### Mistake 2: Over-Abstracting During Extraction
- **Description:** Adding interfaces, factories, and configuration that the original code didn't have
- **Cause:** Over-engineering during extraction, "design for the future"
- **Consequence:** Complexity without proven need, harder to understand and maintain
- **Better:** Extracted library should be as simple as the inlined code was

### Mistake 3: Not Maintaining Backward Compatibility
- **Description:** Changing public API in a patch version
- **Cause:** Not treating extracted library as a published API
- **Consequence:** Breakage in consuming applications
- **Better:** Follow SemVer strictly. Deprecate in MINOR, remove in next MAJOR.

### Mistake 4: Forgetting to Extract Tests
- **Description:** Moving production code without its test suite
- **Cause:** Time pressure, assuming "tests can be rewritten"
- **Consequence:** Untrusted library with no regression protection
- **Better:** Always migrate tests alongside production code

## Anti-Patterns

- **The Grand Unified Library:** One massive "common" package containing everything from DTOs to controllers. Leads to tight coupling and unnecessary dependencies. Extract focused, single-purpose packages.
- **The Copy-Paste Library:** A library that started as copied code and never evolved. The original code and library diverge. Extract properly with path repositories from day one.
- **The Abandoned Extraction:** Library was extracted but lacks a maintainer, tests, or documentation. Becomes technical debt in package form. Assign maintainers before extraction.
- **The Business Logic Library:** A library containing application-specific business logic that never generalizes. Stuck maintaining logic you can't change because other apps depend on it.
- **The YAGNI Interface:** Abstract interfaces for every class "in case we need to swap implementations." Only add interfaces when you have a proven need for polymorphism.

## Examples

### Example 1: Extraction Pipeline
```
Discovery:
  → Found duplicated CustomValidationRule in App A and App B
  → Also used in App C (rule of three satisfied)

Extraction:
  → Create packages/validation-rules/
  → Move rule classes with tests
  → Create composer.json with PHP 8.3+ required
  → Set up Pint/PHPStan in the package
  → Write README with usage examples

Integration (App A):
  → composer require my-org/validation-rules
  → Delete old CustomValidationRule
  → Update imports
  → Run tests (all pass)

Deprecation:
  → After all 3 apps consume the package
  → Remove original duplicated code
  → Archive the extraction issue
```

### Example 2: Extracted Package composer.json
```json
{
    "name": "my-org/laravel-validation-rules",
    "description": "Shared custom validation rules for Laravel applications",
    "require": {
        "php": "^8.3",
        "illuminate/validation": "^11.0"
    },
    "autoload": {
        "psr-4": {
            "MyOrg\\Validation\\": "src/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "MyOrg\\Validation\\ValidationServiceProvider"
            ]
        }
    }
}
```

## Related Topics

- **laravel-monorepo-tools:** Managing extracted packages in a monorepo
- **composer-path-repository-usage:** Developing extracted packages locally
- **dependency-management-across-monorepo:** Aligning dependencies across extracted packages
- **package-skeleton-structure:** Package structure reference for extracted libraries
- **package-versioning-semantic-versioning:** SemVer policies for shared libraries

## AI Agent Notes

- **Context Requirements:** When advising on library extraction, first understand the duplicated code patterns, number of consuming applications, code stability, and organizational commitment to maintenance. Extraction is a significant investment—ensure it's justified.
- **Key Decision Points:** Extraction timing (early vs late), granularity (fine vs coarse grained), storage (monorepo vs separate repo), API surface size.
- **Common Pitfalls in AI Assist:** Don't recommend extraction for business logic. Always emphasize test migration. Recommend the rule of three. Remember that extracted libraries require dedicated maintenance.
- **Laravel-Specific Nuances:** DTOs, validation rules, and Artisan commands are the most commonly extracted library types. The Spatie skeleton is the reference for Laravel package structure. The "rule of three" originated in the refactoring community.

## Verification

- [ ] KU accurately defines shared library extraction patterns
- [ ] Core concepts cover extraction threshold, boundary, API contract
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize rule of three and API minimization
- [ ] Architecture guidelines cover discovery through deprecation phases
- [ ] Performance addresses extraction overhead and test suite growth
- [ ] Security covers dependency scanning and access control
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify grand unified library and copy-paste library
- [ ] Examples show extraction pipeline and package composer.json
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
