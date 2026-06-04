# Rules for Real-world tradeoffs: when Clean Architecture pays off

## Start with Service Layer and Evolve
---
## Category
Architecture | Design
---
## Rule
Start with a simple Service Layer pattern for most Laravel applications; add Clean Architecture layers only when demonstrated complexity justifies the overhead.
---
## Reason
The most successful Clean Architecture implementations in Laravel evolved from simpler patterns. Starting with Clean Architecture for unknown complexity is premature optimization — the architectural tax is paid for benefits that may never materialize.
---
## Bad Example
Full Clean Architecture (ports, adapters, entity mapping, DTOs for every operation) on day one of a 10-table CRUD application. Three months later, no delivery mechanism has changed, no framework migration is planned, and the team is frustrated with the overhead.
---
## Good Example
Controller → Service → Model on day one. Six months later, business logic is complex enough that testing without Laravel bootstrap would be valuable. Introduce port interfaces for repositories. Three months after that, extract Domain entities for the core aggregates. Each step justified by concrete pain.
---
## Exceptions
Applications with well-understood complex domains from the start (fintech, healthcare) may justify Clean Architecture earlier — but still prefer to start lean and add layers as the architecture proves itself.
---
## Consequences Of Violation
Premature architectural overhead; team frustration; reduced feature velocity; architecture abandonment.

## Consider Clean Architecture Lite
---
## Category
Architecture | Design
---
## Rule
For moderate-complexity applications, use "Clean Architecture Lite" (Application + Domain layers without full Port-Adapter infrastructure); add adapters only when variation justifies them.
---
## Reason
Full Port-Adapter infrastructure (interface per repository, contract tests, mapping layer) provides ~20% additional benefit over Application + Domain separation at ~60% additional cost. Clean Architecture Lite delivers 80% of the benefit at 40% of the cost.
---
## Bad Example
Full Hexagonal Architecture for an application with a single database (MySQL), single queue (Redis), and single mail driver (SMTP) — every port has exactly one adapter, and none will ever be swapped.
---
## Good Example
```php
// Clean Architecture Lite: Application layer exists, Domain exists
// But: No port interfaces for repositories — Application uses Eloquent directly
// No mapper layer — Domain entities are Eloquent models with business methods
// No contract tests — single implementation for each infrastructure concern
```
---
## Exceptions
Applications with existing multiple implementations (e.g., supporting MySQL and PostgreSQL, or multiple payment gateways) should use full Port-Adapter.
---
## Consequences Of Violation
Unnecessary interface proliferation; abstraction overhead for single-implementation infrastructure; team frustration with "ceremony architecture."

## Pilot Before Committing Codebase-Wide
---
## Category
Architecture | Process
---
## Rule
Pilot Clean Architecture with one feature or bounded context before committing the entire codebase to the pattern.
---
## Reason
Prove value before imposing cost. A pilot demonstrates whether the architectural approach actually solves the team's problems in the specific context of the application. It also builds team experience and buy-in.
---
## Bad Example
Day one decision: "We're using Clean Architecture for the entire application." Six months later, the team has struggled with the learning curve, hasn't experienced the benefits, and is considering reverting.
---
## Good Example
"Let's try Clean Architecture for the invoicing feature — it has the most complex business logic. We'll evaluate after two months whether the benefits justify expanding to other features." — Pilot determines outcome.
---
## Exceptions
Teams with extensive Clean Architecture experience who have already validated the pattern on previous projects may skip the pilot.
---
## Consequences Of Violation
Codebase-wide commitment before validation; team struggles with unfamiliar pattern; architecture abandoned with sunk cost.

## Quantify Costs Before Deciding
---
## Category
Architecture | Process
---
## Rule
Measure and document the expected costs of Clean Architecture before committing: 2-4x more files per feature, 1.5-3x development time initially, 2-4 week onboarding, ongoing maintenance overhead.
---
## Reason
Architecture decisions are economic decisions. Clean Architecture has measurable costs that must be justified by measurable benefits. Without quantification, teams make emotional rather than economic decisions.
---
## Bad Example
"Clean Architecture is better for maintainability" — with no data on current maintenance costs, no projection of future costs, and no quantification of expected benefit.
---
## Good Example
```php
// ADR-004: Clean Architecture Cost Analysis
// Current cost: Fat controllers — avg 5 hours per feature change (testing + debugging)
// Projected cost: Clean Architecture — avg 8 hours per feature (initial), 4 hours (steady state)
// Break-even: 12 months at current feature velocity
// Additional benefits: Domain tests in 50ms vs 500ms, zero changes for framework upgrades
```
---
## Exceptions
No common exceptions. Architecture decisions without data are based on fashion, not engineering judgment.
---
## Consequences Of Violation
Unjustified architectural costs; no basis for evaluation; inability to make informed go/no-go decisions; architecture fashion instead of engineering.

## Match Architecture to Actual Complexity
---
## Category
Architecture | Design
---
## Rule
Choose the architectural pattern that matches the application's ACTUAL complexity, not its anticipated or aspirational complexity.
---
## Reason
Many applications never reach the complexity that justifies Clean Architecture. Building for anticipated complexity that never materializes is the most common architecture mistake. Complexity should be measured, not assumed.
---
## Bad Example
Full Clean Architecture for a blog engine, newsletter signup form, and contact page — because "we might need it someday." Three years later, the application still has three features and no additional delivery mechanisms.
---
## Good Example
Three-layer architecture for the blog engine. As the team adds a full e-commerce module with complex pricing rules, multiple payment gateways, and an admin CLI, they evaluate and adopt Clean Architecture for the e-commerce bounded context only.
---
## Exceptions
Platforms or libraries designed to be extensible by third parties may need more architecture upfront — but even then, start with the minimum that serves current consumers.
---
## Consequences Of Violation
Over-engineering; architectural tax without return; team frustration; wasted productivity.

## Document Architectural Choice Explicitly
---
## Category
Maintainability | Process
---
## Rule
Document the architectural choice (Service Layer, Clean Architecture Lite, or Full Clean Architecture) in an Architecture Decision Record (ADR), including the rationale and expected benefits.
---
## Reason
Without documentation, architectural decisions are tribal knowledge lost when team members leave. An ADR makes the decision transparent, provides context for future developers, and establishes criteria for when the decision should be revisited.
---
## Bad Example
No ADR. A new developer joins and asks, "Why do we use Clean Architecture?" Team members give different answers. No one remembers why the decision was made or what problems it was meant to solve.
---
## Good Example
```php
// ADR-001: Architectural Pattern Selection
// Status: Accepted
// Decision: Clean Architecture Lite (Domain + Application layers, no full Ports/Adapters)
// Rationale: Business logic is complex (200+ rules), multiple delivery mechanisms (HTTP + Queue),
//   team of 12 engineers, framework migration expected in 3-5 years
// Not considered: Full Port-Adapter (overhead not justified by current infrastructure variation)
```
---
## Exceptions
Single-developer projects may have lightweight documentation — but an ADR is still valuable for the future self.
---
## Consequences Of Violation
Tribal knowledge lost; architectural decisions unclear; new developers confused; no basis for revisiting decisions.

## Avoid Clean Architecture "Theater"
---
## Category
Architecture | Maintainability
---
## Rule
Do not create Clean Architecture directory structure without enforcing the corresponding code rules; "Clean Architecture theater" is worse than no architecture.
---
## Reason
Directories named `Domain/` with Eloquent models inside, or `Application/` with `DB::` calls, create the illusion of architecture without the substance. This is worse than honest three-layer MVC because it provides false confidence while the code has all the same coupling problems.
---
## Bad Example
```php
// app/Domain/Invoice.php — looks clean
namespace App\Domain;
use Illuminate\Database\Eloquent\Model; // Framework import in "Domain"
class Invoice extends Model { /* "Domain" coupled to Eloquent */ }
```
---
## Good Example
Either:
(a) Honest naming: `app/Models/Invoice.php` with Eloquent (three-layer architecture)
(b) Real enforcement: `app/Domain/Invoice.php` with pure PHP AND architecture tests that prevent framework imports
---
## Exceptions
Applications actively migrating from old to new structure may have temporary theater — but this must be a documented intermediate state, not a permanent condition.
---
## Consequences Of Violation
False confidence; no actual architectural benefit; framework coupling hidden behind architecture names; harder to fix than honest MVC.

## Track Productivity Impact
---
## Category
Process | Maintainability
---
## Rule
Track and evaluate team productivity impact after adopting Clean Architecture; if the architecture tax consistently exceeds benefits, consider simplifying.
---
## Reason
Architecture decisions should be revisited with data. If Clean Architecture consistently increases feature delivery time by 2x without corresponding quality or velocity improvements, it's a net-negative decision. Track metrics before and after adoption.
---
## Bad Example
Adopting Clean Architecture, feeling the overhead, but never measuring its impact. Three years later, the team still has the same bugs and slower delivery, but "it's cleaner."
---
## Good Example
```php
// Before Clean Architecture:
// - Average feature delivery: 3 days
// - Production bugs per sprint: 2
// - Test suite runtime: 8 minutes
// After Clean Architecture (6 months):
// - Average feature delivery: 4 days (+33%)
// - Production bugs per sprint: 1 (-50%)
// - Test suite runtime: 2 minutes (-75%)
// Verdict: Acceptable tradeoff — 33% slower delivery for 50% fewer bugs
```
---
## Exceptions
No common exceptions. If you can't measure the impact, you can't evaluate the decision.
---
## Consequences Of Violation
Inability to evaluate architecture effectiveness; continued overhead without data-driven justification; missed opportunities to simplify.
