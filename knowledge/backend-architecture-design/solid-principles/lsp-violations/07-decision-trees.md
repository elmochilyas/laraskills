# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** SOLID principles in PHP: LSP violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Fix strategy — composition vs fixing the inheritance hierarchy
* Decision 2: Contract enforcement — PHPStan types vs runtime assertions
* Decision 3: Base class design — sealed hierarchy vs open extension

---

# Architecture-Level Decision Trees

---

## Decision: Fix Strategy — Composition vs Fixing the Inheritance Hierarchy

---

## Decision Context

Choose whether to fix an LSP violation by replacing inheritance with composition or by correcting the hierarchy.

---

## Decision Criteria

* performance considerations: composition adds one delegation method call (negligible)
* architectural considerations: composition provides runtime flexibility; hierarchy fix is more fundamental
* security considerations: composition can add security checks in the delegating method
* maintainability considerations: composition is easier to refactor incrementally; hierarchy fix may require changing callers

---

## Decision Tree

Does the child class violate LSP by changing behavior expected by callers?
↓
YES → Is the violation caused by inheriting for code reuse without semantic substitutability?
    YES → Replace inheritance with composition (the child should not be a subtype)
    ↓
    Can the child class delegate to the parent instead of inheriting?
    YES → Composition with delegation (extract interface, both classes implement it)
    ↓
    Does the composition approach require changing all callers?
    YES → Introduce interface first, migrate callers, then switch to composition
    NO → Composition is straightforward — implement immediately
    NO → The hierarchy can be fixed (correct the violating method)
        ↓
        Is the violation strengthening preconditions (more restrictive input)?
        YES → Weaken the precondition to match base class (remove extra validation)
        ↓
        Is the extra validation truly needed for this subtype?
        YES → The subtype is not substitutable — use composition instead (different contract)
        NO → Remove the strengthening precondition (it was incorrect)
        NO → Is the violation weakening postconditions (less specific output)?
            YES → Strengthen the postcondition to match base class (return what callers expect)
            NO → Is the violation throwing new exceptions?
                YES → Remove new exceptions or wrap them in base class exception types

---

## Rationale

LSP violations that stem from inheriting for code reuse (not semantic subtyping) should be fixed with composition. Extract the shared interface, have both classes implement it, and use delegation instead of inheritance. Violations in a legitimate hierarchy (where IS-A truly holds) can be fixed by correcting the specific method. Composition is preferred because it's safer and incrementally applicable.

---

## Recommended Default

**Default:** Replace inheritance with composition when the LSP violation occurs. Fix the hierarchy only when the IS-A relationship is genuinely correct and the fix is isolated to a single method.

**Reason:** Composition avoids the fragile base class problem and is safer to refactor incrementally. Hierarchy changes risk breaking other subclasses.

---

## Risks Of Wrong Choice

Keeping LSP violation: callers break when subtypes are substituted, subtle runtime bugs, untestable contracts. Composition for legitimate IS-A: excessive delegation, unnecessary indirection. Forcing hierarchy fix: may break other subclasses or introduce new violations.

---

## Related Rules

- Rule 1: Subtypes must be substitutable for their base types
- Rule 3: Prefer composition over inheritance to avoid LSP violations

---

## Related Skills

- Identify LSP Violations
- Refactor Inheritance to Composition
- Design by Contract

---

## Decision: Contract Enforcement — PHPStan Types vs Runtime Assertions

---

## Decision Context

Choose how to enforce the behavioral contract defined by a base class or interface.

---

## Decision Criteria

* performance considerations: PHPStan has no runtime cost; runtime assertions add overhead per call
* architectural considerations: PHPStan is optional (CI only); runtime assertions always execute
* security considerations: runtime assertions can catch invalid states that violate security assumptions
* maintainability considerations: runtime assertions add defensive code; PHPStan types are declarative

---

## Decision Tree

Can the contract be expressed with PHP type declarations (return types, parameter types)?
↓
YES → Use PHP type declarations (compiled into PHP, checked at call time)
    ↓
    Does PHP 8.1+ support expressing the full contract?
    YES → Types are sufficient for this contract dimension
    ↓
    Does the contract include behavioral constraints (return value > 0, not null when expected)?
    YES → Add runtime assertions for behavioral constraints (type system can't express these)
    NO → PHP types are sufficient
    NO → Use intersection types or generics (PHPStan-level) if PHP types aren't enough
NO → Can PHPStan's type system express the contract?
    YES → Add PHPStan annotations (@template, @extends, @return T of)
    ↓
    Does PHPStan run in CI with strict rules?
    YES → PHPStan-level enforcement is reliable
    NO → Add runtime assertions as well (CI may not catch violations)
NO → Add runtime assertions for behavioral contract enforcement
    ↓
    Is the assertion check expensive (database query, API call)?
    YES → Add only for critical paths or use sampling
    NO → Assert on every invocation

---

## Rationale

PHP's type system (especially 8.1+ with intersection types, enums, and readonly properties) can express many LSP contracts. PHPStan extends this with generics and template types. Runtime assertions catch behavioral violations that types cannot express (return value ranges, state invariants). The ideal approach uses types first, PHPStan second, and runtime assertions for behavioral constraints only.

---

## Recommended Default

**Default:** PHP type declarations for parameter and return types, PHPStan for generic constraints, runtime assertions for behavioral invariants (non-null, positive integers, valid states).

**Reason:** Types are checked at call time with zero additional code. PHPStan provides compile-time verification. Runtime assertions catch behavioral violations that neither system can express.

---

## Risks Of Wrong Choice

No contract enforcement: LSP violations go undetected until runtime, subtle bugs surface in production. Over-assertion: performance overhead, noisy failures for transient conditions, hard to debug. PHPStan-only with no CI enforcement: violations pass review, false sense of security.

---

## Related Rules

- Rule 4: Use PHP type system and PHPStan for contract enforcement before runtime assertions
- Rule 5: Add runtime assertions for behavioral constraints that types cannot express

---

## Related Skills

- Configure PHPStan LSP Rules
- Apply Design by Contract in PHP

---

## Decision: Base Class Design — Sealed Hierarchy vs Open Extension

---

## Decision Context

Choose the design strategy for base classes — whether to allow unlimited inheritance or restrict it.

---

## Decision Criteria

* performance considerations: sealed hierarchy has no performance impact
* architectural considerations: sealed hierarchies prevent LSP violations by limiting extension
* security considerations: sealed hierarchies prevent untrusted code from subverting base class contracts
* maintainability considerations: sealed hierarchies are easier to reason about; open extension requires more documentation

---

## Decision Tree

Is the base class designed for extension by unknown third-party code?
↓
YES → Open extension (annotate expected extension points, document contracts)
    ↓
    Are the extension points and contracts documented?
    YES → Mark methods as `protected` for extension, `final` for non-extension
    ↓
    Can the base class contracts be expressed as tests (abstract test cases for subtypes)?
    YES → Create abstract test case that all subtypes must pass (LSP testing)
    NO → Document contracts explicitly in docblock
    NO → Mark methods as `final` where extension is not expected
NO → Is the hierarchy small (1-3 subclasses) and known at compile time?
    YES → Consider sealed hierarchy (final class or private constructor)
    ↓
    Add `final` keyword to classes not designed for inheritance
    Add `final` to methods that should not be overridden
    NO → Open extension but with `final` guards on methods
        ↓
        Mark methods that participate in the LSP contract as `@final` (intent) or `final` (enforced)
        Provide abstract test case for LSP conformance

---

## Rationale

The safest approach is to mark classes as `final` by default (preventing inheritance unless explicitly designed for it). For classes designed for extension, document contracts carefully and provide abstract test cases to verify LSP conformance. In PHP, `final` is the most effective LSP enforcement tool — it prevents violations by preventing inheritance.

---

## Recommended Default

**Default:** Mark classes as `final` unless inheritance is explicitly designed for. For extensible classes, document contracts and provide LSP conformance tests.

**Reason:** Making a class `final` is the strongest LSP guarantee — no violation can occur if no subclass exists. For extensible classes, tests and documentation are necessary to guide subtype implementors.

---

## Risks Of Wrong Choice

Open by default: LSP violations from unintended subclasses, fragile base class problem. Final everywhere: prevents legitimate extension, may require breaking changes later. No contract documentation: subtype implementors cannot know what invariants to maintain.

---

## Related Rules

- Rule 6: Prefer `final` classes — design for extension only when explicitly needed
- Rule 2: PHPStan's @method and generics help enforce LSP at the type level

---

## Related Skills

- Design Extensible Base Classes
- Write LSP Conformance Tests
- Apply Final by Default Strategy
