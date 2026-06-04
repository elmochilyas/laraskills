# Template Method — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Template Method pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Template Method Not Declared final | High |
| 2 | Too Many Abstract Methods | High |
| 3 | Too Few Hooks | Medium |
| 4 | Template Method Too Long | Critical |
| 5 | Subclass Violating LSP by Strengthening Preconditions | Critical |

---

## 1. Template Method Not Declared final

### Category
Architecture

### Description
The template method is not marked `final`, allowing subclasses to override the algorithm structure and potentially breaking the invariant process.

### Why It Happens
Developers don't use `final` keyword, or don't understand the template method contract.

### Warning Signs
- Template method overrideable (not final)
- Subclass overriding the template method
- Different subclasses implementing different algorithm orders
- Inconsistent behavior across subclasses

### Why Harmful
The template method defines the algorithm skeleton. Allowing override defeats the purpose and can break invariants.

### Consequences
- Inconsistent algorithm structure
- Broken invariants
- Hard-to-reason-about behavior
- Pattern misuse

### Alternative
Mark the template method as `final` in the base class. Only hook methods (overridable steps) should be non-final.

### Refactoring Strategy
1. Identify non-final template methods
2. Add `final` keyword
3. Move subclass-specific logic to hook methods
4. Verify no subclasses override the template method

### Detection Checklist
- [ ] Check template method for final
- [ ] Scan subclasses for template method override
- [ ] Verify hook method pattern

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Template Method, Inheritance Design

---

## 2. Too Many Abstract Methods

### Category
Architecture

### Description
The base class declares too many abstract hook methods, forcing every subclass to implement many steps — most of which are boilerplate.

### Why It Happens
The base class designer tries to make every step customizable, overestimating variation needs.

### Warning Signs
- 10+ abstract methods in base class
- Most subclasses implement most hooks with identical code
- Subclass is mostly copy-paste of other subclasses
- Adding a subclass requires implementing many methods

### Why Harmful
Too many abstract methods create a heavy subclassing burden. Subclasses implement many methods with identical code, violating DRY.

### Consequences
- High subclassing cost
- Duplicated code across subclasses
- Frustration when adding new subclasses
- Template method pattern becomes a burden

### Alternative
Provide default implementations for hook methods (concrete, not abstract). Only require overriding where behavior must vary.

### Refactoring Strategy
1. Review hook methods for mandatory vs optional
2. Provide default implementations for common cases
3. Reduce abstract method count
4. Add tests for default behavior

### Detection Checklist
- [ ] Count abstract methods
- [ ] Evaluate subclass implementation burden
- [ ] Check for duplicated overrides

### Related Rules/Skills/Trees
- Skills: Template Method, Interface Design
- Decision Trees: Hook Method Granularity

---

## 3. Too Few Hooks

### Category
Architecture

### Description
The base class provides too few extension points, forcing subclasses to override the entire template method or copy the whole class to add behavior.

### Why It Happens
Underestimating how subclasses will need to customize the algorithm.

### Warning Signs
- Subclasses overriding the (non-final) template method
- Copying entire class to modify behavior
- "Hooks not available for what we need" complaints
- Hooks in wrong places (before/after wrong steps)

### Why Harmful
Without proper hooks, the pattern forces code duplication or template method violation. Subclasses cannot cleanly add their behavior.

### Consequences
- Template method override (if not final)
- Code duplication
- Pattern violation
- Harder maintenance

### Alternative
Identify common variation points and add hooks. Use the "Hollywood Principle" (don't call us, we'll call you) — call hooks at natural extension points.

### Refactoring Strategy
1. Analyze subclass needs
2. Add hooks at common variation points
3. Provide default (empty) implementations
4. Remove need for template method override

### Detection Checklist
- [ ] Check for template method overrides
- [ ] Analyze subclassing patterns
- [ ] Identify missing hooks

### Related Rules/Skills/Trees
- Skills: Template Method, Hollywood Principle
- Decision Trees: Hook Method Design

---

## 4. Template Method Too Long

### Category
Architecture

### Description
The template method is a long procedural block that's hard to understand, with too many steps and hooks.

### Why It Happens
The algorithm is complex and was written as one large method.

### Warning Signs
- Template method exceeding 50 lines
- 10+ steps in the algorithm
- Hard to trace algorithm flow
- Deep indentation and nested logic

### Why Harmful
Long template methods defeat the pattern's purpose (clear algorithm structure). The skeleton is as complex as the implementation.

### Consequences
- Low readability
- Hard to understand algorithm
- Difficult to add new steps
- High cognitive load

### Alternative
Extract steps into well-named private methods. Keep the template method as a high-level sequence of named method calls.

### Refactoring Strategy
1. Extract each step to a private method
2. Keep template method at 5-10 lines
3. Name methods clearly
4. Add documentation for algorithm structure

### Detection Checklist
- [ ] Measure template method length
- [ ] Evaluate step count
- [ ] Assess readability

### Related Rules/Skills/Trees
- Skills: Template Method, Refactoring, Readability

---

## 5. Subclass Violating LSP by Strengthening Preconditions

### Category
Architecture

### Description
A subclass overrides a hook method to add stronger preconditions (validation, input requirements) than the base class expects, violating Liskov Substitution Principle.

### Why It Happens
Subclass needs stricter validation. Developer adds it in the override without considering substitution.

### Warning Signs
- Subclass throwing exceptions for inputs the base class accepts
- Subclass requiring additional parameters
- Callers broken by stricter subclass behavior
- Unexpected failures when substituting subclass

### Why Harmful
LSP violation causes callers to fail unexpectedly when substituting a subclass. Template method assumptions are broken.

### Consequences
- Substitution failures
- Unexpected exceptions
- Broken polymorphism
- Hard-to-debug issues

### Alternative
Subclasses can weaken preconditions but not strengthen them. Move strict validation to the caller or use separate methods.

### Refactoring Strategy
1. Review subclass preconditions
2. Relax to match or be weaker than base class
3. Move strict validation to caller
4. Add LSP compliance tests

### Detection Checklist
- [ ] Check subclass for stricter preconditions
- [ ] Test substitution behavior
- [ ] Verify LSP compliance

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Template Method, Liskov Substitution Principle
- Decision Trees: Inheritance vs Composition
