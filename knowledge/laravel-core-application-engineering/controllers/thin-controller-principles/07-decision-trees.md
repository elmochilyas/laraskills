# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Thin Controller Principles
**Generated:** 2026-06-03

---

# Decision Inventory

* What to Extract from Fat Controllers (Priority Order)
* Controller Orchestration vs Service Orchestration
* Enforcement Strategy (Manual vs Automated)

---

# Architecture-Level Decision Trees

---

## Decision 1: What to Extract from Fat Controllers (Priority Order)

---

## Decision Context

When refactoring a fat controller, which concerns to extract first based on impact.

---

## Decision Criteria

* Severity of the violation (security, testability, reuse)
* Whether the concern blocks testing without HTTP
* Whether the concern needs to be reused across entry points

---

## Decision Tree

Does the controller contain authorization logic (`if (auth()->user()->isAdmin())`, `Gate::allows()`)?
↓
YES → Extract to FormRequest `authorize()` or Policy FIRST (security-critical)
NO → Does it contain inline validation (`$request->validate([...])`)?
    YES → Extract to FormRequest classes SECOND (enables isolated validation testing)
NO → Does it contain database queries (`User::where()`, `DB::table()`)?
    YES → Extract to Service/Action classes THIRD (enables unit testing)
NO → Does it contain response formatting (JSON array construction)?
    YES → Extract to API Resources (enables response testing)
NO → Does it contain business logic (calculations, multi-step workflows)?
    YES → Extract to Service/Action classes (enables reuse across CLI/queue)
NO → Does it contain orchestration (transactions, multiple service calls)?
    YES → Extract to Service class (enables reuse across entry points)

---

## Rationale

Authorization is the highest priority because inline authorization is invisible to security audits. Validation is next because it blocks isolated testing. Database queries and business logic follow because they couple the HTTP layer to the data layer. Response formatting is lowest priority but still important for API consistency.

---

## Recommended Default

**Default:** Extract in this order: authorization → validation → queries → business logic → response formatting → orchestration
**Reason:** Security concerns (authorization, validation) should be addressed first. Data concerns (queries, logic) second. Presentation concerns (formatting) third.

---

## Risks Of Wrong Choice

* Extracting formatting before authorization: Security gaps remain while response structure is cleaned
* Extracting queries before validation: Validated data is already isolated but queries are still coupled to HTTP
* Not extracting orchestration: Cannot reuse workflows from CLI/queue, test requires HTTP bootstrapping

---

## Related Rules

* Never Perform Authorization Logic Directly in Controllers (05-rules.md)
* Delegate All Business Logic to Services or Actions (05-rules.md)
* Never Write Database Queries in Controllers (05-rules.md)
* Never Format Responses Inline in Controllers (05-rules.md)

---

## Related Skills

* Skill: Refactor a Fat Controller into a Thin Controller
* Skill: Enforce Thin Controller Compliance with Architecture Tests

---

## Decision 2: Controller Orchestration vs Service Orchestration

---

## Decision Context

Whether multi-step workflows (transactions, multiple service calls, events, notifications) should be orchestrated in the controller or in a service class.

---

## Decision Criteria

* Whether the workflow needs to be reused across entry points (HTTP, CLI, queue)
* Whether the workflow involves business logic
* Whether the workflow spans multiple domains

---

## Decision Tree

Does the workflow need to be reused from CLI commands, queues, or webhooks?
↓
YES → Service class orchestration (must be reusable)
NO → Does the workflow involve business logic (calculations, conditional rules)?
    YES → Service class orchestration
NO → Is the workflow purely HTTP flow control (redirect on success/error)?
    YES → Controller orchestration is acceptable
NO → Does the workflow span multiple domains (billing + inventory + notifications)?
    YES → Service class orchestration (keeps controller focused on HTTP)
NO → Does the workflow have a single entry point and simple flow?
    YES → Controller orchestration possible but service is still preferred

---

## Rationale

The controller's responsibility is HTTP translation — not process orchestration. Orchestration logic in controllers cannot be reused across entry points and cannot be unit-tested without HTTP. Service classes encapsulate orchestration logic that is reusable and independently testable.

---

## Recommended Default

**Default:** Service class orchestration for any workflow with business logic, cross-domain operations, or multi-entry-point requirements. Controller orchestration only for simple HTTP flow control.
**Reason:** Orchestration in services enables reuse across CLI/queue/webhook entry points and unit testing without HTTP bootstrapping.

---

## Risks Of Wrong Choice

* Orchestration in controller: Cannot reuse from CLI/queue, must test through HTTP, violates SRP
* Orchestration in service for simple redirect-only flow: Unnecessary indirection for trivial HTTP logic

---

## Related Rules

* Do Not Use Controllers as Orchestrators (05-rules.md)
* Follow the Three-Step Pattern: Validate, Delegate, Return (05-rules.md)

---

## Related Skills

* Skill: Refactor a Fat Controller into a Thin Controller

---

## Decision 3: Enforcement Strategy (Manual vs Automated)

---

## Decision Context

Whether to rely on code review to enforce thin controller discipline or implement automated architecture tests.

---

## Decision Criteria

* Team size
* Current violation rate
* CI pipeline maturity
* Tolerance for regression

---

## Decision Tree

Is there an existing architecture test framework (Pest architecture testing)?
↓
YES → Write architecture tests banning Model imports, DB facades, and `$request->validate()` in controllers
NO → Does the CI pipeline run tests on every push?
    YES → Add Pest architecture testing and write enforcement tests
    NO → Can CI be configured to run architecture tests?
        YES → Configure CI, then add architecture tests
        NO → Rely on code review — but accept violations will slip through
NO → Team size > 3 developers?
    YES → Architecture tests are essential (code review cannot catch all violations)
    NO → Small team may rely on code review, but architecture tests are still recommended

---

## Rationale

Architecture tests enforce the thin controller discipline programmatically. Without automated enforcement, violations creep in during code review gaps, especially in larger teams. Pest architecture tests run in milliseconds and catch violations before they reach production.

---

## Recommended Default

**Default:** Automated enforcement via Pest architecture tests banning Model imports, DB facade, and `$request->validate()` in controllers
**Reason:** Architecture tests are fast (milliseconds), run in CI on every push, and catch violations before code review. Manual enforcement through code review alone is unreliable at scale.

---

## Risks Of Wrong Choice

* No enforcement: Violations accumulate silently, controllers grow fat over time
* Only code review: High effort, inconsistent, violations slip through during review gaps
* Too-strict rules: False positives block legitimate patterns (route model binding type hints)
* Too-lenient rules: Architecture tests pass but controllers still have violations

---

## Related Rules

* Ban Eloquent Model and DB Imports in Controllers via Architecture Tests (05-rules.md)
* Limit Controller Imports to HTTP-Layer Concerns (05-rules.md)

---

## Related Skills

* Skill: Enforce Thin Controller Compliance with Architecture Tests
