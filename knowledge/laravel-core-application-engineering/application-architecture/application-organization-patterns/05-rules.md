# Application Organization Patterns — Rules

## Start with Technical-Layer, Evolve When Complexity Demands It

Begin every new Laravel project with the default technical-layer structure. Reorganize only when navigating the current structure measurably slows the team.

---

## Category

Architecture

---

## Rule

Use Laravel's default technical-layer organization for new projects. Transition to domain-driven or modular patterns at ~20 models (consider restructuring) and ~100 models (modular becomes viable). Never choose a non-default pattern at project start.

---

## Reason

Premature domain organization adds overhead (empty directories, manual file moves, deeper namespaces) without benefit. Organizational patterns should be earned by codebase complexity, not chosen by anticipation.

---

## Bad Example

Creating `app/Domain/Billing/`, `app/Domain/Users/`, `app/Domain/Inventory/` on day one for a 5-model CRUD application.

---

## Good Example

Starting with `app/Models/`, `app/Http/Controllers/`, `app/Services/`. At 25 models across 3 business domains, evaluating and transitioning to domain-driven organization.

---

## Exceptions

Applications with clear domain boundaries specified in requirements from day one may start with domain-driven or hybrid structure if the team has prior experience.

---

## Consequences Of Violation

Empty directories, navigation overhead without payoff, friction with Artisan generators, developer confusion about where new files belong.

---

## Define Bounded Contexts Before Restructuring

Map domain boundaries explicitly before moving any files between organizational patterns.

---

## Category

Design

---

## Rule

Before migrating from technical-layer to domain-driven or modular organization, document each bounded context, its responsibilities, and its interfaces with other contexts. Only restructure when boundaries are agreed upon by the team.

---

## Reason

Without explicit bounded contexts, domain directories become arbitrary groupings. Cross-domain model access and tangled dependencies proliferate, making the new structure worse than the flat one it replaced.

---

## Bad Example

Creating `app/Domain/Payment/` but having `Payment` models accessed directly by `Order` services in `app/Domain/Sales/` without a contract boundary.

---

## Good Example

Documenting: "Billing context owns invoices, payments, subscriptions. Sales context owns orders, quotes, products. Communication between contexts happens via `BillingGatewayInterface`."

---

## Exceptions

No common exceptions. Bounded context mapping is a prerequisite for any organizational restructure.

---

## Consequences Of Violation

Cross-domain model access creates hidden dependencies, modules cannot be tested in isolation, extraction to packages is impossible, tangled dependency graph.

---

## Never Mix Organizational Patterns

Choose one consistent organizational pattern and apply it to every file in the application.

---

## Category

Maintainability

---

## Rule

Do not have both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php` in the same project. Every file must follow the same top-level organization convention.

---

## Reason

Mixed patterns create ambiguity about where to place new files. Team members make different choices over time, scattering related code across the codebase and increasing cognitive load for everyone.

---

## Bad Example

```
app/
  Services/
    LogService.php
  Domain/
    Payment/
      Services/
        PaymentService.php
  Http/Controllers/
    PaymentController.php
```

---

## Good Example

```
app/
  Domain/
    Payment/
      Services/
        PaymentService.php
      Controllers/
        PaymentController.php
    Logging/
      Services/
        LogService.php
```

---

## Exceptions

The `app/` directory may contain shared infrastructure (middleware, exceptions, providers) outside domain directories in modular and domain-driven patterns. All application logic must follow the chosen convention.

---

## Consequences Of Violation

Inconsistent file placement, code scattered across directories, onboarding confusion, structural entropy over time.

---

## Enforce Domain Boundaries with Automated Checks

Use static analysis and CI rules to prevent unauthorized cross-domain access in domain-driven and modular patterns.

---

## Category

Reliability

---

## Rule

Configure PHPStan or Psalm custom rules to detect and prevent cross-domain direct dependency violations. Use CI pipeline checks that fail on unauthorized cross-module access. Do not rely on directory structure alone for boundary enforcement.

---

## Reason

Directories do not prevent cross-boundary access. Without automated enforcement, domain boundaries erode as developers take shortcuts, creating a de facto monolith within the domain structure.

---

## Bad Example

```php
// In Sales domain — directly accessing Billing model
$invoice = \App\Domain\Billing\Models\Invoice::find($id);
// No contract, no interface, no enforcement
```

---

## Good Example

```php
// Sales accesses Billing through a contract
class SalesService
{
    public function __construct(
        private BillingGatewayInterface $billing,
    ) {}
}
// CI rule: App\Domain\Sales\ cannot directly reference App\Domain\Billing\Models
```

---

## Exceptions

The shared kernel (`app/Shared/` or `app/Kernel/`) is accessible from all domains. No other cross-boundary access is permitted.

---

## Consequences Of Violation

Eroded domain isolation, tangled dependencies, extraction to packages blocked, team ownership boundaries meaningless.

---

## Keep Shared Kernel Minimal

Extract code to the shared kernel only when it is consumed by three or more domains or modules.

---

## Category

Design

---

## Rule

Minimize the `app/Shared/` or `app/Kernel/` directory. A new shared utility must be used by at least three distinct domains before it qualifies for extraction. Prefer duplication over premature sharing.

---

## Reason

Every file in shared code becomes a dependency for every domain or module. Bloating the shared kernel creates a de facto monolith that every module depends on, defeating the purpose of modular separation.

---

## Bad Example

```
app/Shared/
  Helpers/
    StringHelper.php      // used by 2 domains
    DateHelper.php         // used by 1 domain
    MathHelper.php         // used by 1 domain
    ArrayHelper.php        // used by 1 domain
```

---

## Good Example

```
app/Shared/
  Helpers/
    PaginationHelper.php  // used by 4 domains
```

---

## Exceptions

Framework infrastructure (base middleware, exception handling, base providers) in shared code is exempt from the three-domain rule.

---

## Consequences Of Violation

Monolithic shared kernel, unnecessary coupling between modules, domain extraction requires breaking shared dependencies, increased cognitive load.

---

## Do Not Use Modular Organization for Single-Team Applications

Reserve the modular pattern for multi-team codebases with 50+ models and clear per-team ownership boundaries.

---

## Category

Architecture

---

## Rule

Use technical-layer or domain-driven organization for applications developed by a single team. Only adopt modular organization when multiple teams need ownership of separate modules.

---

## Reason

Modular patterns add significant overhead: per-module service providers, inter-module contracts, autoloading configuration, and module communication infrastructure. This overhead is only justified when team coordination requires strong isolation.

---

## Bad Example

A 3-developer team building a 20-model application using `app/Modules/Billing/`, `app/Modules/Users/`, `app/Modules/Reports/`.

---

## Good Example

Same 3-developer team using `app/Domain/Billing/`, `app/Domain/Users/`, `app/Domain/Reports/` with contracts between domains.

---

## Exceptions

Applications planned for package extraction from day one may use modular organization, provided the overhead is accepted and documented.

---

## Consequences Of Violation

Unnecessary overhead, per-module boilerplate, autoloading complexity, team coordination friction from module interfaces that don't match team boundaries.

---

## Document Organizational Pattern Decisions

Record the rationale for every organizational pattern choice in an Architecture Decision Record (ADR).

---

## Category

Maintainability

---

## Rule

When adopting or changing an organizational pattern, document the decision in a project ADR including: model count, team size, bounded context map, chosen pattern, and the trigger that made the change necessary.

---

## Reason

Organizational patterns are team coordination mechanisms. The rationale must be understood by everyone who adds files. Without documentation, new team members don't know why the structure exists and may introduce inconsistencies.

---

## Bad Example

A project restructured to domain-driven pattern with no documentation. New developers add files to technical-layer locations because they don't know the convention.

---

## Good Example

```markdown
# ADR-003: Domain-Driven Organization
- Date: 2026-03-15
- Model count: 32
- Team: 5 developers
- Bounded contexts: Billing, Sales, Users, Inventory
- Pattern: Domain-driven
- Trigger: Navigation friction in technical-layer slowed feature development
```

---

## Exceptions

Single-developer projects may skip formal ADRs but should still document the chosen convention in a project README or CONTRIBUTING file.

---

## Consequences Of Violation

Convention drift as team members use different patterns, onboarding confusion, structural inconsistency, wasted refactoring effort when the pattern is rediscovered and changed back.
