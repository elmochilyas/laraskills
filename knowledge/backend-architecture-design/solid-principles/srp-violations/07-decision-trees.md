# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** SOLID principles in PHP: SRP violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Responsibility extraction — action classes vs service classes
* Decision 2: Responsibility granularity — fine vs coarse splitting
* Decision 3: SRP enforcement — manual discipline vs automated analysis

---

# Architecture-Level Decision Trees

---

## Decision: Responsibility Extraction — Action Classes vs Service Classes

---

## Decision Context

Choose how to extract responsibilities from a God Model or God Class — into action classes (one per operation) or service classes (grouped operations).

---

## Decision Criteria

* performance considerations: action classes load only what they need; service classes may load unused dependencies
* architectural considerations: action classes enforce SRP strictly; service classes may accumulate multiple responsibilities
* security considerations: action classes allow per-operation authorization; service classes need method-level auth
* maintainability considerations: action classes are easy to find and delete; service classes reduce file count

---

## Decision Tree

Does the class have more than one reason to change (more than one stakeholder or use case)?
↓
YES → SRP violation — extract responsibilities
    ↓
    Are the responsibilities different operations over the same entity (create, update, cancel)?
    YES → Consider action classes (one class per operation)
    ↓
    Would each action class have only one public method?
    YES → Action class pattern (e.g., CreateOrderAction, CancelOrderAction)
    ↓
    Can the action class be tested independently without other operations?
    YES → Action class is the right choice (independent testability)
    NO → Action class still has hidden dependencies — extract those too
    NO → Consider service classes (group related operations)
        ↓
        Does the service class have a clear, single responsibility (e.g., OrderProcessingService)?
        YES → Service class is acceptable (single responsibility at service level)
        NO → Split further — the service class still violates SRP
    NO → Are the responsibilities from different domains (auth, billing, notifications)?
        YES → Extract each to its own class or service (different domains = different reasons to change)
        NO → They belong in the same class (same reason to change)

---

## Rationale

Action classes (one class per use case) provide the strictest SRP adherence — each class has exactly one reason to change. Service classes group related operations and are more common in Laravel but can accumulate unrelated responsibilities. Action classes are easier to test, find, and delete but create more files. Choose based on team preference and change frequency.

---

## Recommended Default

**Default:** Action classes for complex operations (multiple steps, dependencies); service classes for simple CRUD groups. Extract to action classes when a service class grows beyond 5-7 methods.

**Reason:** Action classes provide the strongest SRP guarantee and are independently testable. Service classes reduce file count for simple CRUD but must be monitored for scope creep.

---

## Risks Of Wrong Choice

God model/service class: accumulates unrelated responsibilities, hard to test, changes cascade. Tiny action classes for simple operations: file proliferation, navigation overhead. Trait-based separation (hides dependencies): extracted class still implicitly depends on the model.

---

## Related Rules

- Rule 1: A class should have only one reason to change
- Rule 2: Extract business logic from Eloquent models into dedicated action or service classes

---

## Related Skills

- Apply Action Domain Pattern
- Design Service Classes
- Identify SRP Violations in Eloquent Models

---

## Decision: Responsibility Granularity — Fine vs Coarse Splitting

---

## Decision Context

Choose how finely to split responsibilities — many small classes or fewer larger classes.

---

## Decision Criteria

* performance considerations: more classes add autoloading overhead (negligible with OpCache)
* architectural considerations: fine-grained splitting provides better separation but more files
* security considerations: finer granularity enables more precise authorization
* maintainability considerations: very fine splitting creates navigation overhead; too coarse recreates the god class

---

## Decision Tree

How many responsibilities does the current class have?
↓
1 → SRP is satisfied (no change needed)
2-3 → Extract into 2-3 classes (coarse splitting — appropriate for most cases)
4-7 → Extract into separate classes per responsibility (one class = one responsibility)
8+ → The class is a God Class — extract systematically
    ↓
    Split into action or service classes (one per distinct responsibility)
    ↓
    After extraction, does any new class still have multiple responsibilities?
    YES → Split further until each class has exactly one reason to change
    NO → Good granularity achieved

Do extracted classes communicate directly with each other?
YES → Consider if they're truly separate responsibilities
    Can responsibility A be tested without responsibility B?
    YES → They're independent — keep separate
    NO → They share state or workflow — consider merging or introducing a use case orchestrator
NO → Good separation

---

## Rationale

The right granularity gives each class exactly one reason to change. For most Laravel models, extracting 2-5 responsibilities (persistence, business logic, validation, formatting) into separate classes is appropriate. Over-splitting (100 classes for 10 responsibilities) creates navigation overhead without additional benefit.

---

## Recommended Default

**Default:** Extract 2-5 responsibilities per class. If a class has more than 5 public methods with different reasons to change, split further.

**Reason:** Classes with 2-5 focused responsibilities are easy to find, understand, and test. More than 5 suggests the class is doing too much; fewer than 2 is usually fine.

---

## Risks Of Wrong Choice

Over-splitting: file proliferation, difficult navigation, constructor injection overload. Under-splitting: SRP violation persists, class still has multiple reasons to change. Extracting without decoupling: extracted class still depends on the original model, defeating the purpose.

---

## Related Rules

- Rule 4: When extracting, ensure the extracted class doesn't still depend on the original model

---

## Related Skills

- Assess Class Cohesion
- Refactor God Class

---

## Decision: SRP Enforcement — Manual Discipline vs Automated Analysis

---

## Decision Context

Choose how to detect and prevent SRP violations — through manual code review or automated static analysis.

---

## Decision Criteria

* performance considerations: automated analysis adds CI time but no runtime cost
* architectural considerations: automated analysis encodes SRP rules as executable checks
* security considerations: automated analysis can flag classes with too many dependencies (potential god class)
* maintainability considerations: automated analysis is consistent; manual review misses violations over time

---

## Decision Tree

Is the team larger than 3 developers?
↓
YES → Automated analysis recommended (manual review doesn't scale)
    ↓
    Is CI pipeline available for static analysis?
    YES → Add rules for:
        → Maximum class size (e.g., PHPStan: max 200 lines per class)
        → Maximum method count (e.g., max 10 public methods per class)
        → Maximum dependency count (e.g., max 5 constructor parameters)
    NO → Manual review with SRP checklist in PR template
NO → Manual review may be sufficient but add automated checks as team grows
    ↓
    Can PHPStan detect the current SRP violations?
    YES → Add PHPStan rules to enforce limits
    NO → Start with manual review and update checklist
    ↓
    Track: are SRP violations being caught in code review or only in production?
    Code review → Enforcement is working
    Production → Enforcement gap — add automated checks

---

## Rationale

Manual discipline degrades over time, especially as teams grow. Automated analysis (PHPStan rules for max class size, method count, dependency count) provides consistent enforcement. Start with simple rules (max lines, max methods) and add more as the team matures.

---

## Recommended Default

**Default:** PHPStan rules for max class size (200 lines) and max method count (10 public methods). Additional rules as SRP violations are discovered.

**Reason:** Automated enforcement catches violations before they merge. Lines and method count are simple proxies that catch most SRP violations without false positives.

---

## Risks Of Wrong Choice

No enforcement: SRP violations accumulate silently, god classes grow, code becomes untestable. Overly strict limits: false positives, developers fight the tool, legitimate grouping is forced apart.

---

## Related Rules

- Rule 5: Use static analysis to detect SRP violations — max class size, method count, dependency count

---

## Related Skills

- Configure PHPStan for SRP Enforcement
- Design Metrics for Cohesion
