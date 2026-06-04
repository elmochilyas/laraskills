# Rules: COS-09 — When to Deviate from Defaults

## R01: Start with Defaults — Never Deviate Without Measured Pain
---
## Category
Architecture
---
## Rule
Always start with Laravel's default structure. Only deviate when you can name a specific, measurable friction caused by the defaults.
---
## Reason
Preemptive architecture wastes effort on structures for problems that may never exist. Defaults are optimized for productivity — you cannot know which deviations are needed until you experience the friction.
---
## Bad Example
```php
// Day 1: Full Clean Architecture with 8 layers and interfaces for everything
// Month 6: Application is a simple CRUD — 90% of structure unused
// Team spent 40% of first sprint setting up architecture
```
---
## Good Example
```php
// Day 1: Default Laravel structure
// Month 8: "I spend 5 minutes per feature tracing through 6 files across 3 layers"
// → Add domain subdirectories (hybrid approach)
// Specific friction → specific deviation
```
---
## Exceptions
Projects explicitly architected as modular monoliths or DDD from inception, with team consensus and documented rationale.
---
## Consequences Of Violation
Wasted development time on unused structures. Architectural cynicism from the team. Wrong abstractions that must be refactored.
---

## R02: Document Every Deviation with an Architecture Decision Record
---
## Category
Architecture
---
## Rule
Write an ADR for every deviation from defaults, including: the specific problem, alternatives considered, chosen solution, and expected costs/benefits.
---
## Reason
Undocumented deviations are fragile — the next developer may revert them without understanding the original problem, or accept the complexity without knowing why it exists. ADRs create institutional memory.
---
## Bad Example
```php
// Team restructured to domain-based organization
// No ADR — 2 years later, new architect asks:
// "Why are we domain-based? This adds complexity."
// Nobody remembers the original 15-engineer problem.
```
---
## Good Example
```md
// ADR-001: Domain-Based Organization
// Problem: 12 engineers in 3 teams had daily merge conflicts in app/Models/
// Decision: Split into app/Domains/{Billing,Catalog,Identity}
// Costs: 2-week migration, PSR-4 config, team training
// Accepted: 2026-03-15
```
---
## Exceptions
Trivial deviations (e.g., adding `app/Services/`) that are standard practice and reversible.
---
## Consequences Of Violation
Architectural drift without accountability. Future teams cannot determine whether a deviation was deliberate or accidental.
---

## R03: Apply the Six-Month Rule for New Projects
---
## Category
Architecture
---
## Rule
Wait at least six months before making significant structural deviations from defaults in new projects.
---
## Reason
Domain boundaries, team structure, and architectural needs reveal themselves organically. Premature decisions based on speculation are often wrong, leading to expensive restructuring later.
---
## Bad Example
```php
// Month 1: Build full modular monolith with 6 modules
// Month 4: Realize business domains are different than assumed
// Month 5: Restructure — move 80% of code to different modules
```
---
## Good Example
```php
// Month 1-6: Default structure, observe patterns
// Month 6: "Billing logic appears in 8 different places"
// Month 7: Extract Billing domain based on real data, not speculation
```
---
## Exceptions
Projects with well-understood domain models (e.g., migrating from a legacy system with documented boundaries).
---
## Consequences Of Violation
Wrong module boundaries. Expensive restructuring when reality contradicts initial assumptions.
---

## R04: Deviate One Level at a Time — No Leapfrogging
---
## Category
Architecture
---
## Rule
Progress deviations incrementally: defaults → add subdirectories → hybrid → domain-based → modules. Never skip directly to the most complex structure.
---
## Reason
Each level of deviation has a cost. Jumping to full domain isolation without experiencing hybrid structure means paying maximum cost for benefits you may not need. Incremental deviation allows cost-benefit evaluation at each step.
---
## Bad Example
```php
// Day 1: app/Domains/Billing/, app/Domains/Catalog/ — full domain isolation
// Month 6: Only 3 people work on the codebase
// Paying full domain overhead for single-team benefit
```
---
## Good Example
```php
// Month 1-12: Default + app/Services/
// Month 12-18: Hybrid (domain subdirectories in layers)
// Month 18+: Full domain only if 3+ teams exist
```
---
## Exceptions
Projects where organizational constraints demand full structure from day one (e.g., multi-team kickoff).
---
## Consequences Of Violation
Paying complexity cost for benefits not yet needed. Team overhead managing structure that doesn't match scale.
---

## R05: Never Deviate Without Automated Enforcement
---
## Category
Reliability
---
## Rule
Ensure any structural deviation can be enforced via architecture tests or static analysis before implementing.
---
## Reason
A new directory structure without enforcement degrades within months. Developers will place files in old and new locations, creating two inconsistent systems. Enforcement ensures the deviation remains intact.
---
## Bad Example
```php
// Create app/Domains/Billing/ — no enforcement
// 6 months later: 60% of billing code in app/Domains/Billing/
// 40% still in app/Models/, app/Http/Controllers/ (flat)
// "We migrated to domains" — no, you have a mix
```
---
## Good Example
```php
// Before restructuring, write architecture tests:
test('billing controllers are in Domains') ... /**
test('no flat billing models exist') ... /**
// Then restructure with confidence that enforcement prevents backsliding
```
---
## Exceptions
Temporary deviations during active refactoring, with a defined completion deadline.
---
## Consequences Of Violation
Half-migration — worst outcome. Two inconsistent structures. Developers don't know where new code goes.
---

## R02b: Evaluate Deviations Against Five Questions
---
## Category
Architecture
---
## Rule
Before adopting any structural deviation, answer these five questions: (1) What specific friction exists? (2) Does the deviation address it? (3) Does the benefit exceed the cost? (4) Is there a less invasive option? (5) Can it be incremental?
---
## Reason
Structured evaluation prevents architecture-by-trend and ensures every deviation is justified. If any question cannot be answered positively, the deviation should not proceed.
---
## Bad Example
```php
// "We should use repositories" — question 1: "What friction?"
// Answer: "It's what real projects do." ← Not specific friction → STOP
```
---
## Good Example
```php
// "We should use domain-based organization"
// Q1: "30 files in app/Models/ from 4 business areas — 5 min to find the right model"
// Q2: Yes — each domain would have 5-8 models
// Q3: Yes — 2-week migration vs ongoing time waste
// Q4: Hybrid approach first
// Q5: Yes — start with Billing, then Catalog
```
---
## Exceptions
No common exceptions — this framework applies to all deviations.
---
## Consequences Of Violation
Architecture decisions based on fashion rather than value. Complexity without benefit. Team resentment toward "architecture for its own sake."
---

## R07: Reject Repository Pattern for All-Model Single-DataSource Projects
---
## Category
Architecture
---
## Rule
Do not implement repository pattern when all models use Eloquent as their single data source.
---
## Reason
Repositories add abstraction cost (interface, implementation, binding) without benefit when there is only one data source. They are justified only when models have multiple data sources (API + cache + DB) or when testing requires swapping implementations.
---
## Bad Example
```php
interface UserRepositoryInterface { ... }
class EloquentUserRepository implements UserRepositoryInterface { ... }
// Single data source (MySQL), single implementation
// 15 files of ceremony for zero encapsulation benefit
```
---
## Good Example
```php
// No repository — use Eloquent directly, or service with Eloquent
class UserService {
    public function findActiveUsers(): Collection {
        return User::where('active', true)->get();
    }
}
```
---
## Exceptions
Projects where testing requires an in-memory implementation, or where data comes from multiple backends (API + DB + cache).
---
## Consequences Of Violation
Ceremonial abstraction adding maintenance burden. Every repository modification requires changing interface, implementation, and binding.
---

## R08: Reject Interface-Per-Service When Only One Implementation Exists
---
## Category
Architecture
---
## Rule
Do not create an interface for every service class. Add interfaces only when multiple implementations are planned or exist.
---
## Reason
Interface-per-service is a premature abstraction pattern. It assumes every service needs to be swappable, but in practice, most services have exactly one implementation. The interface adds ceremony without value.
---
## Bad Example
```php
// Only one implementation now and foreseeable future:
interface PaymentServiceInterface { ... }
class StripePaymentService implements PaymentServiceInterface { ... }
// 10 extra lines per service for zero benefit
```
---
## Good Example
```php
// Concrete class until second implementation is needed:
class StripePaymentService { ... }
// When PayPal is added: extract interface, implement twice
```
---
## Exceptions
Libraries or packages where the consumer must be able to swap implementations, or when testing truly requires mocking at the interface level.
---
## Consequences Of Violation
Interface bloat — 100+ interfaces with one implementation each. Codebase doubled in file count with no behavioral benefit.
