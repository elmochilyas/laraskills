## Split Features Into Sub-Features At ~20 Files

When a feature exceeds 20 files, organize it into sub-features grouped by sub-domain.

---

## Category

Maintainability

---

## Rule

Monitor file counts per feature. At approximately 20 files, evaluate splitting into sub-features (e.g., `Billing/Invoicing/`, `Billing/Subscriptions/`). Do not let a single feature exceed 50 files without sub-feature extraction.

---

## Reason

A feature with 50+ files collapses into the same navigational difficulty as layer-based structure. Sub-features restore cohesion by grouping related files within the larger domain. The 20-file threshold is a heuristic that balances cohesion with organizational overhead.

---

## Bad Example

```php
// 50+ files in one flat feature directory
app/Features/Billing/
  Controllers/ (14 files)
  Models/ (8 files)
  Services/ (12 files)
  Requests/ (6 files)
  Actions/ (5 files)
  Events/ (4 files)
  // Too many responsibilities for one directory
```

---

## Good Example

```php
app/Features/Billing/
  Invoicing/
    Controllers/
    Models/
    Services/
    Providers/InvoicingServiceProvider.php
  Subscriptions/
    Controllers/
    Models/
    Services/
    Providers/SubscriptionsServiceProvider.php
```

---

## Exceptions

Features with many small, tightly interdependent files may exceed 20 files without splitting, provided the cohesion within the feature is strong and navigation remains easy.

---

## Consequences Of Violation

Navigational difficulty within oversized features. Developers waste time locating files. Feature becomes a monolith with the same problems as layer-based organization.

---

## Keep The Shared Kernel Lean

Every interface, DTO, and event in the shared kernel must be consumed by at least two features. Remove unused kernel items.

---

## Category

Maintainability

---

## Rule

Audit the shared kernel (`app/Kernel/`) every quarter. Remove contracts that are consumed by fewer than two features. Do not add speculative abstractions "just in case."

---

## Reason

Every item in the shared kernel is a backward-compatibility commitment. A bloated kernel with 200+ contracts creates cognitive overhead, makes the kernel hard to navigate, and turns it into a dumping ground. A lean kernel is a stable foundation.

---

## Bad Example

```php
// app/Kernel/Contracts/ — 200+ interfaces
interface PdfGenerator {}       // Used only by Billing
interface CsvExporter {}        // Used only by Billing
interface SmsProvider {}        // Used only by Notifications
// Most are single-consumer — should live in their feature
```

---

## Good Example

```php
// app/Kernel/Contracts/
interface UserProvider {}        // Used by Billing, CMS, Reporting
interface PaymentGateway {}      // Used by Billing, Marketplace
// Only multi-consumer contracts live here
```

---

## Exceptions

Framework-level abstractions (e.g., `CacheInterface`, `LoggerInterface`) that wrap Laravel's own contracts may live in the kernel even if single-consumer, because they represent infrastructure boundaries.

---

## Consequences Of Violation

Bloated shared kernel that is hard to navigate. Backward compatibility commitments for unused abstractions. Tendency to use kernel as a dumping ground.

---

## Enforce Dependency Direction With Static Analysis

Domain groups must depend toward the kernel, never outward. Enforce this with directory-scoped static analysis rules.

---

## Category

Architecture

---

## Rule

Define static analysis rules (PHPStan/Psalm) that enforce dependency direction: `app/Financial/` may not import from `app/CMS/`. Only `app/Kernel/` can be imported from anywhere. Outer rings depend on inner rings.

---

## Reason

Without enforcement, dependency direction erodes over time. A CMS feature that imports a Financial model creates a cycle that prevents independent testing and extraction. Directory-scoped static analysis rules make the architecture self-documenting and machine-enforced.

---

## Bad Example

```php
// In app/Features/CMS/Models/Post.php
use App\Features\Financial\Models\Invoice;
// CMS depends on Financial — direction violation
```

---

## Good Example

```php
// In app/Features/CMS/Models/Post.php
use App\Kernel\Models\Author;
// Depends on Kernel — correct direction
```

---

## Exceptions

Cross-cutting infrastructure (logging, monitoring) may import from any feature if the import is clearly non-business-logic. Document and minimize these exceptions.

---

## Consequences Of Violation

Circular domain group dependencies. Cannot test or extract domain groups independently. Architectural decay that requires major refactoring to fix.

---

## Use CODEOWNERS For Team Ownership

Assign each domain group to a specific team using GitHub CODEOWNERS. Require team approval for changes.

---

## Category

Scalability

---

## Rule

Create a `.github/CODEOWNERS` file that maps each domain group directory to a responsible team. Require the owning team's approval for all changes within that domain. Update ownership when teams reorganize.

---

## Reason

Without explicit ownership, no one feels responsible for a domain group's quality. Code reviews are assigned arbitrarily. Orphaned features accumulate bugs and design debt. CODEOWNERS makes ownership visible and enforceable.

---

## Bad Example

No CODEOWNERS file. Changes to `app/Features/Financial/` are reviewed by whoever is available, regardless of domain knowledge.

---

## Good Example

```
# .github/CODEOWNERS
/app/Features/Financial/ @team-financial
/app/Features/CMS/ @team-content
/app/Features/Users/ @team-platform
/app/Kernel/ @team-architecture
```

---

## Exceptions

Small teams (1-3 developers) where everyone works across all domains do not need CODEOWNERS. The overhead of team approval exceeds the benefit.

---

## Consequences Of Violation

Orphaned features with no responsible owner. Inconsistent code quality across domains. Knowledge silos without accountability.

---

## Establish A Feature Lifecycle

Define a lifecycle for features: new → stable → optionally extracted. Use it to manage maturity and extraction decisions.

---

## Category

Scalability

---

## Rule

Document and follow a feature lifecycle:

1. **New**: In development, high change frequency, lives in monorepo
2. **Stable**: Mature API, low change frequency, considered for extraction
3. **Extracted**: Moved to standalone Composer package with its own versioning

---

## Reason

Without a lifecycle, features never get extracted. They accumulate in the monorepo indefinitely, causing 500k+ LOC monorepos with 45-minute deploys. A lifecycle provides clear criteria and process for extraction decisions.

---

## Bad Example

A 5-year-old project has 300 features in a single Laravel app. Deploys take 45 minutes. All features are treated the same regardless of stability.

---

## Good Example

```
## Feature Lifecycle

1. New — in monorepo, under active development
2. Stable — in monorepo, API stable for 3+ months
3. Candidate — stable + consumed by multiple projects → extract to package
```

---

## Exceptions

Features that are inherently coupled to the application's core (e.g., a User feature that depends on the application's auth configuration) may never be extracted. Document the reasoning.

---

## Consequences Of Violation

Monorepo bloat. Long deployment times. Features that could be independently versioned and deployed remain coupled to the main application lifecycle.

---

## Version The Shared Kernel Independently

When domain groups need independent release schedules, version the shared kernel as a separate package.

---

## Category

Scalability

---

## Rule

If multiple domain groups (or external consumers) depend on the shared kernel, manage it as a separate Composer package with its own `composer.json`, versioning, and release cycle. Require semantic versioning for kernel changes.

---

## Reason

A shared kernel that changes at the same pace as the main application creates coupling. Domain groups cannot evolve independently if every kernel change breaks them. Independent versioning allows stable kernel releases and predictable upgrades.

---

## Bad Example

Shared kernel lives in `app/Kernel/` with no versioning. Any change to a contract breaks all consuming features simultaneously.

---

## Good Example

```json
// packages/kernel/composer.json
{
  "name": "app/kernel",
  "version": "1.2.0",
  "require": {},
  "autoload": {
    "psr-4": {
      "App\\Kernel\\": "src/"
    }
  }
}
```

---

## Exceptions

Single-team projects or projects where all features are released together do not benefit from independent kernel versioning. Add it only when independent release cycles are needed.

---

## Consequences Of Violation

Breaking changes to the kernel cascade to all consuming features simultaneously. Domain groups cannot evolve at their own pace.

---

## Run Static Analysis With Directory-Scoped Rules

Configure PHPStan or Psalm to enforce different rules for different directories.

---

## Category

Scalability

---

## Rule

Use PHPStan's `scanFiles` or Psalm's directory-scoped configuration to enforce directory-specific rules: "No imports from `Financial/*` in `CMS/*`", "Kernel must not import from any feature", "Feature models must not be imported externally."

---

## Reason

A single set of static analysis rules treats the entire codebase uniformly. Directory-scoped rules encode the architecture's dependency constraints as machine-enforced policies, preventing architectural erosion at scale.

---

## Bad Example

```neon
# Single set of rules for entire codebase
parameters:
  level: 6
```

---

## Good Example

```neon
parameters:
  level: 6
  scanFiles:
    - phpstan.domain-rules.neon
```

```neon
# phpstan.domain-rules.neon
parameters:
  ignoreErrors:
    - '#use App\\Features\\CMS#'  # Not specific enough
```

Use a custom PHPStan extension or custom sniff to enforce directory-level import rules.

---

## Exceptions

Projects with <10 features do not need directory-scoped rules. The cost of configuring them outweighs the benefit at small scale.

---

## Consequences Of Violation

Architectural erosion undetected by automated tooling. Cross-domain imports accumulate silently. Dependency cycles discovered only during extraction attempts.

---

## Use Domain Groups For Related Features

Group related features under a domain directory to reduce top-level feature count.

---

## Category

Code Organization

---

## Rule

When the feature count exceeds ~20 features at the top level, organize related features into domain groups. For example, `Financial/Billing/`, `Financial/Payments/`, `Content/CMS/`, `Content/Media/`.

---

## Reason

50 features at the top level of `app/Features/` is as hard to navigate as 50 controllers in `app/Http/Controllers/`. Domain groups provide a second level of organization that groups related features, reducing cognitive load.

---

## Bad Example

```
app/Features/ (50 top-level feature directories — hard to navigate)
```

---

## Good Example

```
app/Features/
  Financial/
    Billing/
    Payments/
    Accounting/
  Content/
    CMS/
    Media/
    SEO/
  UserManagement/
    Auth/
    Profiles/
    Permissions/
```

---

## Exceptions

Projects with <15 features do not need domain groups. The extra directory level adds overhead without proportional benefit.

---

## Consequences Of Violation

Top-level feature proliferation. Navigation difficulty. Flat structure that does not scale to 50+ features.

---

## Run Affected Tests Only In CI

CI must detect which features changed and run only their tests, not the full suite.

---

## Category

Scalability

---

## Rule

Use CI path triggers or monorepo tooling (nx, turborepo) to identify which features changed in a pull request and execute only the corresponding test suites. Run the full suite on merges to main or on a nightly schedule.

---

## Reason

Running 100% of tests for a change in one feature wastes CI resources and slows feedback. In a 100-feature project, a full test run may take 20+ minutes. Affected-only testing keeps feedback under 2 minutes.

---

## Bad Example

```yaml
# Runs all tests for every change
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit
```

---

## Good Example

```yaml
name: Financial Tests
on:
  pull_request:
    paths:
      - 'app/Features/Financial/**'
      - 'tests/Features/Financial/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit --testsuite=Financial
```

---

## Exceptions

The full suite should run on every merge to main regardless of changes, to catch cross-feature interaction bugs.

---

## Consequences Of Violation

Slow CI feedback (20+ minutes). Resource waste running tests for unchanged features. Developers tempted to skip tests.

---

## Document The Feature Extraction Process

Maintain a documented process for extracting a feature into a standalone package.

---

## Category

Scalability

---

## Rule

Create and maintain an `EXTRACTING_A_FEATURE.md` guide that details: 1) Move directory to packages/, 2) Create composer.json, 3) Update namespaces, 4) Publish migrations/config, 5) Register provider, 6) Update CI.

---

## Reason

Without a documented process, each feature extraction is a unique, error-prone manual procedure. Team members avoid extracting because they do not know the steps. A documented process makes extraction predictable and repeatable.

---

## Bad Example

A stable feature that has been a candidate for extraction for 2 years remains in the monorepo because nobody wants to figure out the steps.

---

## Good Example

```markdown
# Extracting a Feature

1. `git mv app/Features/Billing packages/vendor/billing/src`
2. Create `composer.json` with PSR-4 autoloading
3. Update all namespaces from `App\Features\Billing\` to `Vendor\Billing\`
4. Update service provider extends and registration
5. Add package to main app's composer.json
6. Move tests to package's test directory
7. Update CI to run package tests
```

---

## Exceptions

Projects that never plan to extract features (single application with no multi-project reuse) may skip this documentation.

---

## Consequences Of Violation

Feature extraction never happens due to process friction. Monorepo continues to grow. Reusable features remain coupled to the main application.

---

## Establish Sub-Feature Convention Consistency

All sub-features within a domain group must follow the same internal structure conventions.

---

## Category

Code Organization

---

## Rule

Define a standard internal structure for sub-features (Controllers/, Models/, Services/, Providers/). Every sub-feature within a domain group must follow this structure. Do not allow inconsistent conventions across sub-features.

---

## Reason

Inconsistent conventions create confusion. Developer A creates `Billing/Invoicing/` with a service provider; Developer B creates `Billing/Payments/` without one. Developers must check each sub-feature individually to understand its structure. Consistency makes any sub-feature predictable.

---

## Bad Example

```php
// Invoicing has a provider
Billing/Invoicing/Providers/InvoicingServiceProvider.php

// Payments does not — routes loaded from parent provider
Billing/Payments/routes.php
// Inconsistent — developer must check each sub-feature
```

---

## Good Example

```php
// Both have the same structure
Billing/Invoicing/Controllers/
Billing/Invoicing/Models/
Billing/Invoicing/Providers/InvoicingServiceProvider.php
Billing/Invoicing/routes.php

Billing/Payments/Controllers/
Billing/Payments/Models/
Billing/Payments/Providers/PaymentsServiceProvider.php
Billing/Payments/routes.php
```

---

## Exceptions

Simple sub-features with no views or migrations may omit those directories. The rule applies to structure, not to presence of every possible directory.

---

## Consequences Of Violation

Navigation inconsistency. Developer frustration from checking each sub-feature individually. Higher cognitive load when switching between sub-features.
