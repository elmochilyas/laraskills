# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Template Method pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Template Method vs Strategy pattern selection
* Decision 2: Hook method design — minimal vs maximal extension points
* Decision 3: Template Method enforcement — final vs protected non-final

---

# Architecture-Level Decision Trees

---

## Decision: Template Method vs Strategy Pattern Selection

---

## Decision Context

Choose between Template Method (inheritance-based algorithm skeleton) and Strategy (composition-based interchangeable algorithms).

---

## Decision Criteria

* performance considerations: Template Method uses inheritance (zero indirection); Strategy adds delegation overhead
* architectural considerations: Template Method fixes algorithm structure; Strategy allows entire algorithm replacement
* security considerations: Template Method prevents algorithm structure modification; Strategy allows complete swapping
* maintainability considerations: Template Method creates fragile base classes; Strategy is more composable

---

## Decision Tree

Does the algorithm have a fixed structure with only specific steps that vary?
↓
YES → Template Method (the structure is invariant, only steps vary)
    ↓
    Are there fewer than 5 variation points?
    YES → Template Method is appropriate (few hooks, clear structure)
    ↓
    Do most subclasses override all hooks?
    YES → Consider Strategy — if every subclass overrides everything, composition is clearer
    NO → Template Method is correct (most subclasses only override some hooks)
    NO → Template Method with too many hooks becomes hard to understand — consider Strategy
NO → Does the entire algorithm vary (completely different implementation per variant)?
    YES → Strategy pattern (swap the whole algorithm, not just steps)
    ↓
    Do callers need to switch algorithms at runtime?
    YES → Strategy (runtime selection is natural)
    NO → Consider: could Template Method with conditional hook selection work?
        YES → Template Method with conditionally-overridden hooks
        NO → Strategy pattern
NO → Does the algorithm have shared structure but entire steps that vary independently?
    YES → Strategy within Template Method (delegate variant steps to strategy objects)

---

## Rationale

Template Method inherits the algorithm structure; subclasses override specific hook methods. Strategy composes the entire algorithm. Use Template Method when the algorithm structure is fixed and only some steps vary. Use Strategy when the entire algorithm varies or needs runtime selection. The patterns can combine: Strategy objects can be passed into Template Method hooks.

---

## Recommended Default

**Default:** Template Method when algorithm structure is fixed with 2-4 variation points. Strategy when the entire algorithm varies or needs runtime selection.

**Reason:** Template Method provides reuse of algorithm structure at the cost of inheritance coupling. Strategy provides complete algorithm interchangeability at the cost of delegation overhead. Choose based on how much varies.

---

## Risks Of Wrong Choice

Template Method for completely different algorithms: subclasses override everything, no reuse, fragile base class. Strategy for fixed structure with few variants: unnecessary delegation, no structure reuse, caller manages strategy selection.

---

## Related Rules

- Rule 1: Template Method defines algorithm skeleton — subclasses override specific steps, not the whole algorithm
- Rule 2: Use Strategy when the entire algorithm varies

---

## Related Skills

- Apply Template Method Pattern
- Apply Strategy Pattern

---

## Decision: Hook Method Design — Minimal vs Maximal Extension Points

---

## Decision Context

Choose how many hook methods the Template Method provides — few mandatory hooks or many optional extension points.

---

## Decision Criteria

* performance considerations: empty hook calls add nanoseconds — negligible
* architectural considerations: minimal hooks enforce discipline; maximal hooks provide flexibility
* security considerations: minimal hooks reduce surface for misuse; maximal hooks increase flexibility
* maintainability considerations: minimal hooks are easier to understand; maximal hooks are more extensible

---

## Decision Tree

How many steps in the algorithm?
↓
2-4 STEPS → Minimal hooks (one abstract method per step, no optional hooks)
    ↓
    Can subclasses achieve all variation by overriding one step?
    YES → Single abstract method (simplest, clearest contract)
    ↓
    Example: `importer->import()` calls `parse()`, `validate()`, `save()`
    Subclass overrides `parse()` (the only variant step)
    NO → One abstract per variant step (match algorithm steps directly)
5+ STEPS → Consider grouping hooks (not every step needs a hook)
    ↓
    Are some steps optional (subclass may skip or provide default)?
    YES → Provide default empty implementations for optional hooks
    ↓
    Optional hooks are protected with empty body (subclass overrides if needed)
    ↓
    Mark abstract only for mandatory steps
    NO → Are steps always overridden by all subclasses?
        YES → Abstract (forces implementation, no silent defaults)
        NO → Protected with default (covers common case, allows override)

---

## Rationale

Every hook is a contract between the base class and subclass. Too many hooks make the base class hard to understand and the subclass hard to implement. Too few hooks force subclasses to copy the entire algorithm. The right number matches the algorithm's natural variation points — typically 2-4 hooks. Optional hooks should have empty default implementations.

---

## Recommended Default

**Default:** One abstract hook per mandatory variation point. Protected empty defaults for optional steps. Maximum 4 hooks total.

**Reason:** Hooks are contracts that must be maintained. Each hook that isn't overridden by most subclasses is unnecessary complexity. 2-4 hooks balance flexibility with understanding.

---

## Risks Of Wrong Choice

Too many hooks: subclass must implement many methods, base class is hard to read, hook interaction is complex. Too few hooks: subclass must copy entire algorithm for minor variations, defeating the pattern. Abstract for optional hooks: forces boilerplate implementations.

---

## Related Rules

- Rule 3: Keep hook methods focused — one responsibility per hook
- Rule 4: Provide default empty implementations for optional hooks

---

## Related Skills

- Design Hook Methods
- Implement Template Method in Laravel

---

## Decision: Template Method Enforcement — Final vs Protected Non-Final

---

## Decision Context

Choose whether the Template Method itself should be marked `final` (preventing override of the algorithm structure).

---

## Decision Criteria

* performance considerations: `final` has no performance impact
* architectural considerations: `final` guarantees algorithm structure; non-final allows subclass to override the entire method
* security considerations: `final` prevents subclasses from bypassing pre/post processing
* maintainability considerations: `final` is safer but less flexible; non-final is flexible but fragile

---

## Decision Tree

Should subclasses be able to override the entire algorithm?
↓
YES → Protected non-final (flexible but fragile)
    ↓
    Document: if you override the template method, you must call `parent::method()` or replicate the structure
    ↓
    Is this acceptable (subclass fully controls the algorithm)?
    YES → Protected non-final (trusts subclasses)
    NO → Make it `final` (subclass must use hooks)
NO → `final` template method (algorithm structure is invariant)
    ↓
    Are all hook methods `protected` (not `public`)?
    YES → Correct — hooks are internal to the hierarchy
    ↓
    Add `final` to all template methods that define algorithm structure
    ↓
    Subclass access: hooks are `protected`, abstract where mandatory
    NO → Make hooks `protected` — public hooks allow callers to call hooks out of order
NO → Is there a reasonable use case for a subclass to extend the algorithm with additional steps?
    YES → Add a hook at the end (`afterProcess()`) rather than making the template method non-final
    NO → `final` is safe

---

## Rationale

The Template Method should almost always be `final`. The entire point of the pattern is that the algorithm structure is invariant — subclasses customize via hooks, not by overriding the structure. Making the template method non-final allows subclasses to accidentally break the algorithm order or skip pre/post processing.

---

## Recommended Default

**Default:** Mark the Template Method as `final`. Provide hooks as `protected abstract` or `protected` with defaults.

**Reason:** The algorithm structure is the pattern's core guarantee. Subclasses that need to change the structure should use a different pattern (Strategy). `final` prevents accidental algorithm corruption.

---

## Risks Of Wrong Choice

Non-final template method: subclass overrides and skips validation step, breaks algorithm order, violates LSP. Final without adequate hooks: subclass forced to copy entire class to add behavior, defeats the pattern.

---

## Related Rules

- Rule 5: Declare the template method `final` to prevent algorithm structure modification
- Rule 6: Subclasses customize via hook methods, not by overriding the template method

---

## Related Skills

- Enforce Template Method with Final
- Design Replaceable Hooks
