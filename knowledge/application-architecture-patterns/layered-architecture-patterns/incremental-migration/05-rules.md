# Rules for Incremental migration from MVC to layered architecture

## Use Strangler Fig Pattern
---
## Category
Architecture | Maintainability
---
## Rule
Migrate to layered architecture using the Strangler Fig pattern: write new code in the new structure while leaving old code in place; gradually redirect old paths to new code.
---
## Reason
Big-bang rewrites break the application for weeks or months and block feature development. The Strangler Fig pattern allows both architectures to coexist, enabling migration at the team's pace without blocking deliverables.
---
## Bad Example
"Let's rewrite the entire application in Clean Architecture over the next three months." — Application is broken for months, features blocked, enormous regression risk.
---
## Good Example
```php
// Old structure stays: app/Http/Controllers/, app/Models/
// New structure added: src/Domain/, src/Application/, src/Infrastructure/
// Both PSR-4 roots registered in composer.json
// New features built in new structure; old features migrated when touched
```
---
## Exceptions
Greenfield projects starting fresh have no legacy to strangulate — they can choose the target architecture from day one.
---
## Consequences Of Violation
Big-bang rewrite risk; extended period with no shipable features; team demoralization; regression hell.

## Stop at Any Phase When Cost Exceeds Benefit
---
## Category
Architecture | Design
---
## Rule
Evaluate cost/benefit at each migration phase and be willing to stop; do not proceed to the next phase unless the current pain justifies the additional complexity.
---
## Reason
Phase 1 (service extraction) alone solves fat controllers. Phase 2 (action isolation) prevents god objects. Phases 3-4 (interfaces, full layers) add significant overhead that most applications never need. Stopping at the right point maximizes ROI.
---
## Bad Example
Migrating through all four phases to full Clean Architecture because "that's the goal," even though Phase 2 already solved all concrete problems the team was experiencing.
---
## Good Example
```php
// ADR-002 documents: "We stopped at Phase 2 (Action isolation).
// Phase 3/4 overhead is not justified for our current complexity.
// Revisit if: multiple delivery mechanisms emerge, or business logic
// requires framework-independent testing."
```
---
## Exceptions
Applications with a clear trajectory toward framework independence (fintech, platforms with multiple clients) may proceed through phases proactively.
---
## Consequences Of Violation
Over-engineering for the actual problem; architecture tax paid for benefit that never materializes; team frustration.

## Migrate Feature-by-Feature
---
## Category
Maintainability | Code Organization
---
## Rule
Migrate code to the new architecture one feature at a time, not one file at a time; when a feature is touched for development, migrate it to the new structure.
---
## Reason
Feature-level migration ensures the migrated code is actually needed (not dead code) and that each migration delivers visible value. File-by-file migration creates long periods where neither the old nor the new structure is fully functional.
---
## Bad Example
Migrating `UserController` (100 methods) to new structure as a batch, even though 60 of those methods are for features that haven't been touched in years.
---
## Good Example
When implementing a new "invoice discounts" feature, migrate the invoicing feature from old structure to new structure. `UserController` stays in old structure until a user feature is touched.
---
## Exceptions
Security-critical or compliance-mandated restructuring may require full migration regardless of feature touch frequency.
---
## Consequences Of Violation
Dead code migration; wasted effort on untouched features; long migration timelines with no visible progress.

## Use Adapters as Glue
---
## Category
Architecture | Code Organization
---
## Rule
Use adapter classes to bridge old Laravel-idiomatic code to new layered-architecture code; do not modify old code to match new patterns.
---
## Reason
Adapter classes allow new-architecture code to interact with old-architecture code without modifying either. This prevents the migration from turning into a cascading refactor where every change requires changes across the entire codebase.
---
## Bad Example
Modifying the old `UserController` to inject new-architecture use cases — now the old controller depends on the new structure, creating coupling between the two architectures.
---
## Good Example
```php
// Adapter class bridges old and new
class LegacyInvoiceAdapter implements InvoiceRepository {
    public function __construct(private LegacyInvoiceService $legacy) {}
    public function save(Invoice $invoice): void {
        $this->legacy->store($invoice->toArray()); // Translate new → old
    }
}
// New use case uses adapter — old code untouched
```
---
## Exceptions
No common exceptions. Adapters are the recommended pattern for coexistence.
---
## Consequences Of Violation
Cascading refactors; old code modified to support new structure; risk of breaking legacy functionality; migration scope creep.

## Enforce New Structure Strictly From Day One
---
## Category
Architecture | Maintainability
---
## Rule
Enforce architectural rules for new directories strictly from the start; do not allow old-pattern violations in new directories because "it's just this one time."
---
## Reason
Old-pattern violations in new directories contaminate the new architecture from the start. Once allowed, the boundary between old and new blurs, and the new structure inherits the same problems the migration was meant to solve.
---
## Bad Example
New `src/Application/` directory has a use case that imports `EloquentUserRepository` from Infrastructure because "it's just one query." Three months later, half the use cases bypass port interfaces.
---
## Good Example
```php
// Architecture tests enforce from day one:
arch('src-application')
    ->expect('App\Application')
    ->toOnlyUse(['App\Domain']);
// New directory violations fail CI immediately
```
---
## Exceptions
Legacy directories (`app/`) have relaxed rules during migration — enforcement is only for new architecture directories.
---
## Consequences Of Violation
New architecture contaminated; migration fails to solve original problems; "new" structure repeats the same mistakes as "old" structure.

## Document Current Migration Phase
---
## Category
Maintainability | Code Organization
---
## Rule
Explicitly document the current migration phase (Phase 1-4) and what each phase means for development conventions; ensure all developers know which architecture to follow.
---
## Reason
Without documentation, new developers don't know which architecture to follow. They might write Clean Architecture code in Phase 1 (where only services exist) or write fat-controller code in Phase 4 (where layers are strict). Documentation removes ambiguity.
---
## Bad Example
A new developer joins and sees `app/Domain/` and `app/Application/` directories but also sees `app/Http/Controllers/InvoiceController.php` with 400 lines of business logic. Which pattern should they follow?
---
## Good Example
```php
// MIGRATION.md
// Phase: 2 (Action Isolation) — Started 2026-03-01
// What's allowed: Service classes extracted, Action classes for new features
// What's prohibited: Business logic in Controllers (must delegate to Services)
// Next phase triggers: When testing business logic without Laravel becomes painful
// Architecture tests enforce Phase 2 rules
```
---
## Exceptions
Single-developer projects may not need formal documentation — but a README note or ADR is still recommended.
---
## Consequences Of Violation
Architecture confusion; inconsistent code patterns; onboarding friction; developers follow wrong conventions.

## No Big-Bang Rewrites
---
## Category
Architecture | Maintainability
---
## Rule
NEVER attempt a big-bang rewrite of an existing application into a new architecture; always use incremental migration.
---
## Reason
Big-bang rewrites are the most common cause of failed architectural transformations. They block feature development, introduce massive regression risk, and often fail to deliver before the business loses confidence.
---
## Bad Example
"Stop all feature work. We're rewriting the entire codebase into Clean Architecture. Estimated completion: 6 months." — The most dangerous phrase in software engineering.
---
## Good Example
"Next sprint, we're extracting the invoicing service from the controller. The pay-invoice feature needs changes anyway, so we'll migrate it to the new structure while we're there. Estimated effort: 2-3 days."
---
## Exceptions
No common exceptions. Even in extreme cases (abandoned codebase, total rewrite needed), the rewrite should be done as a new project alongside the old one (Strangler Fig), not as a replacement of the existing codebase.
---
## Consequences Of Violation
Application broken for months; feature roadmap frozen; business loses confidence; project cancelled; team demoralized.

## Evaluate Stopping Point Consciously
---
## Category
Architecture | Design
---
## Rule
When stopping migration at a phase, document it as an intentional decision; do not let the migration drift into a permanent half-state without acknowledging it.
---
## Reason
A permanent half-migration creates uncertainty: should new developers follow old patterns or new patterns? Should they add interfaces or not? An intentional documented stopping point provides clear guidance and avoids architecture drift.
---
## Bad Example
Team stopped at Phase 2 six months ago but never documented the decision. New developers assume the team is "still working on" full Clean Architecture. Some write ports and adapters for new features, others don't. Inconsistency grows.
---
## Good Example
```php
// ADR-003: Migration Stopping Decision
// Status: Accepted
// Decision: Stop at Phase 2 (Action Isolation).
// Rationale: Phase 3/4 overhead not justified for current complexity.
// Triggers for resuming:
//   1. Second delivery mechanism required (e.g., CLI alongside HTTP)
//   2. Business logic testing requires framework independence
//   3. Team grows beyond 10 engineers with architectural experience
```
---
## Exceptions
Applications still actively migrating have no permanent stopping point — but each phase transition should still be an intentional decision.
---
## Consequences Of Violation
Architecture ambiguity; inconsistent patterns; developer confusion; drift between old and new approaches.
