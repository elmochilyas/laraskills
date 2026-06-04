# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Bridge pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Bridge vs Adapter
* Decision 2: Bridge vs class explosion (N×M problem)
* Decision 3: Abstraction and Implementor granularity

---

# Architecture-Level Decision Trees

---

## Decision: Bridge vs Adapter

---

## Decision Context

Choose between the Bridge pattern (decouple abstraction from implementation, both vary independently) and the Adapter pattern (make an existing interface compatible with what clients expect).

---

## Decision Criteria

* performance considerations: both add one level of indirection per call — negligible for I/O-bound operations
* architectural considerations: Bridge anticipates variation on both sides; Adapter wraps a fixed interface
* security considerations: Bridge can vary security behavior per implementation; Adapter translates fixed behavior
* maintainability considerations: Bridge requires N+M classes vs Adapter's single wrapper

---

## Decision Tree

Do both the abstraction (what the client sees) and implementation (how it works) need to vary independently?
↓
YES → Bridge (decouple abstraction hierarchy from implementation hierarchy)
    ↓
    Example: API response formatting → abstraction: VersionedResponse (V1Response, V2Response)
    Implementation: Formatter (JsonFormatter, XmlFormatter)
    N×M combinations → (V1/JSON, V1/XML, V2/JSON, V2/XML) → Bridge: 2+2 = 4 classes, not 4
    ↓
    Will the abstraction and implementation change at different rates?
    YES → Bridge (the pattern is designed for this — each axis changes independently)
        ↓
        Example: notification system — abstraction adds new notification types
        Implementation adds new channels — they evolve separately
        NO → If they always change together, merge them (no Bridge needed)
    NO → Does the implementation need to vary independently of the abstraction?
        YES → Bridge (adapter doesn't allow independent variation)
        NO → Does the client expect a different interface than what exists?
            YES → Adapter (make existing implementation match client's expected interface)
                ↓
                Adapter = interface translation (client wants X, existing provides Y)
                Bridge = independent variation of abstraction and implementation
                ↓
                Example Adapter: client expects `PaymentGateway->charge()`, SDK has `StripeSDK->createCharge()`
                Example Bridge: want to vary response format AND response version independently
                NO → Neither pattern needed — direct dependency or simple interface
NO → Single abstraction, single implementation (no variation)?
    YES → Neither (direct dependency is simpler)
    ↓
    Adapter: if the existing implementation doesn't match the expected interface
    Bridge: unnecessary — no independent variation exists
    NO → If only the implementation varies (Strategy pattern), not the abstraction
        YES → Strategy pattern (swap algorithms, same abstraction)
        NO → Bridge

---

## Rationale

Bridge solves the N×M class explosion problem when both abstraction and implementation have multiple variants. Adapter solves interface incompatibility. The key differentiator: Bridge anticipates variation on both sides of the relationship; Adapter bridges a fixed gap. Most PHP/Laravel cases that look like Bridge are actually Adapter or Strategy.

---

## Recommended Default

**Default:** Adapter when the interface is incompatible. Strategy when the implementation varies but the abstraction is stable. Bridge only when both abstraction and implementation have independent variants (N×M problem).
**Reason:** Bridge is the most complex of the three patterns. Only pay that cost when you genuinely need independent variation on both axes.

---

## Risks Of Wrong Choice

Bridge when Adapter suffices: over-engineered, double the classes needed. Adapter when Bridge needed: N×M class explosion or rigid architecture. Strategy when Bridge needed: strategy only handles implementation variation, not abstraction variation.

---

## Related Rules

- Rule 1: Bridge = independent variation of abstraction AND implementation (N×M)
- Rule 2: Adapter = interface translation, Strategy = single-side variation

---

## Related Skills

- Implement Bridge Pattern
- Distinguish Bridge vs Adapter vs Strategy
- Detect N×M Class Explosion

---

## Decision: Bridge vs Class Explosion (N×M Problem)

---

## Decision Context

Choose between the Bridge pattern (N+M classes) and enumerated subclasses (N×M classes) when you have multiple abstraction types and multiple implementation types.

---

## Decision Criteria

* performance considerations: Bridge adds one indirection vs direct class call — negligible
* architectural considerations: Bridge separates concerns into two hierarchies; N×M couples them
* security considerations: Bridge allows independent security audits per hierarchy; N×M security is scattered
* maintainability considerations: Bridge adds N+M classes; N×M adds N×M classes — massive difference at scale

---

## Decision Tree

Do you have both N abstraction variants and M implementation variants?
↓
YES → Check the total: N × M ≥ N + M?
    ↓
    Example: 3 abstraction variants × 4 implementation variants = 12 classes (N×M) vs 3+4 = 7 classes (Bridge)
    ↓
    Is N × M > 6 (significant class explosion)?
    YES → Bridge (N+M scales linearly; N×M grows exponentially)
        ↓
        Bridge saves 50%+ classes when N×M > N+M
        Example: 5×5 = 25 vs 5+5 = 10 → Bridge saves 15 classes
        ↓
        Are variants on each side likely to grow independently?
        YES → Bridge (adding one abstraction now costs 1, not M)
            ↓
            Adding one abstraction variant: Bridge = 1 new class; N×M = M new classes
            NO → Bridge still beneficial (fewer classes, clearer separation)
    NO → Is N = 1 or M = 1 (only one variant on one side)?
        YES → Bridge not needed (Strategy pattern if M > N, Adapter if interface issue)
            ↓
            1 abstraction, M implementations → Strategy pattern
            M abstractions, 1 implementation → unlikely, but direct hierarchy works
            NO → Bridge (even 2×3 = 6 vs 2+3 = 5 — small saving, but separation is cleaner)
NO → Do you have only one variant set that grows?
    YES → Strategy pattern (implementation variants only) or hierarchy (abstraction variants only)
    NO → No pattern needed — direct class hierarchy is simplest

---

## Rationale

Bridge prevents the N×M class explosion problem. When you have 3+ abstraction variants and 3+ implementation variants, Bridge saves significant code. The real value is not just class count — adding a new abstraction with Bridge requires one new class vs M new classes with N×M approach. At scale, this difference is transformative.

---

## Recommended Default

**Default:** Bridge when N ≥ 3 and M ≥ 3 (significant class explosion risk). Strategy when only one side varies. Direct hierarchy when both sides are small (N ≤ 2, M ≤ 2) and not growing.
**Reason:** Bridge's upfront complexity is justified when it prevents exponential class growth.

---

## Risks Of Wrong Choice

N×M approach at scale: combinatorial explosion of classes, violating DRY, each new variant requires M new classes. Bridge for 1×M: unnecessary abstraction, Strategy would suffice. No pattern for N×M: duplicate code across N×M classes, changes must be made in N×M places.

---

## Related Rules

- Rule 3: Use Bridge when N ≥ 3 and M ≥ 3 to prevent class explosion
- Rule 4: One-sided variation = Strategy, not Bridge

---

## Related Skills

- Detect N×M Class Explosion
- Implement Bridge for N×M
- Calculate Bridge Class Savings

---

## Decision: Abstraction and Implementor Granularity

---

## Decision Context

Choose how granular the Abstraction and Implementor interfaces should be — coarse (few large methods) or fine (many small methods).

---

## Decision Criteria

* performance considerations: finer granularity means more method calls through the bridge — measurable in hot paths
* architectural considerations: coarse interfaces are stable but inflexible; fine interfaces are flexible but unstable
* security considerations: finer granularity provides more control points for security enforcement
* maintainability considerations: coarse interfaces change less often; fine interfaces require changes for minor behavioral shifts

---

## Decision Tree

Does the abstraction need fine-grained control over the implementation?
↓
YES → Fine-grained implementor interface (methods match implementation capabilities)
    ↓
    Example: abstraction has `drawCircle(x, y, radius)`, implementor has `drawPixel(x, y, color)`
    ↓
    Does the abstraction need to compose multiple implementor calls per operation?
    YES → Fine-grained implementor is appropriate (abstraction composes low-level operations)
        ↓
        Example: `VectorRenderer` draws circle with: `drawPixel` at multiple coordinates
        NO → Coarse-grained is simpler (single implementor call per abstraction operation)
    NO → Coarse-grained methods (implementor methods match abstraction operations closely)
        ↓
        Example: abstraction has `renderCircle(Circle $circle)`, implementor has `drawCircle(int $x, int $y, int $radius): void`
        ↓
        Are new abstraction variants expected regularly?
        YES → Coarse-grained (each new abstraction variant maps to one implementor call — less coupling)
            ↓
            New abstraction variant just calls existing implementor methods
            NO → Either works; prefer coarse-grained for simplicity
NO → Are new implementor variants expected regularly?
    YES → Coarse-grained implementor interface (fewer methods to implement for each new variant)
        ↓
        Adding a new implementation: implement 5 coarse methods vs 20 fine methods
        Example: adding `XmlFormatter` implementor — 3 methods vs 15
        NO → Fine-grained is acceptable (implementors are stable, not added frequently)
            ↓
            Fine-grained gives the abstraction more control
            Implementor count is small and stable

---

## Rationale

Coarse-grained interfaces are the better default: fewer methods to implement, more stable, and easier to add new variants. Fine-grained interfaces are justified when the abstraction needs precise control over implementation behavior (e.g., rendering engines where compositing matters). The tradeoff: coarse = easy to implement, fine = flexible composition.

---

## Recommended Default

**Default:** Coarse-grained implementor interface (methods match abstraction operations). Fine-grained only when the abstraction composes low-level implementation operations (e.g., rendering, document generation).
**Reason:** Coarse-grained interfaces are easier to implement, more stable, and support faster addition of new implementor variants.

---

## Risks Of Wrong Choice

Fine-grained with many implementors: high implementation cost for each new variant, interface churn. Coarse-grained with complex composition: abstraction forced to use a single large method when it needs fine composition. Fine-grained with no abstraction composition: unnecessary complexity, implementors have unused methods.

---

## Related Rules

- Rule 5: Prefer coarse-grained implementor interfaces by default
- Rule 6: Fine-grained implementor interface = abstraction composes low-level operations

---

## Related Skills

- Design Coarse-Grained Implementor Interface
- Design Fine-Grained Implementor Interface
- Select Implementor Granularity
