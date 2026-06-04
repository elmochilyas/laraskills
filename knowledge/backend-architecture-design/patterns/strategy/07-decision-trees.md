# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Strategy pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Strategy vs inline conditional selection
* Decision 2: Strategy interface design — broad vs narrow
* Decision 3: Strategy selection — factory vs service container tags vs client-side switch

---

# Architecture-Level Decision Trees

---

## Decision: Strategy vs Inline Conditional Selection

---

## Decision Context

Choose whether to extract variants into Strategy classes or keep inline conditionals.

---

## Decision Criteria

* performance considerations: Strategy adds delegation overhead (negligible); inline conditional is slightly faster
* architectural considerations: Strategy eliminates conditional chains and enables Open-Closed Principle
* security considerations: Strategy allows per-strategy security checks; inline conditionals may miss edge cases
* maintainability considerations: Strategy isolates each variant; inline conditionals grow unboundedly

---

## Decision Tree

How many variants exist?
↓
1 → No pattern needed (single implementation, no variation)
2 → Inline conditional is acceptable (if/else for two variants is clear)
    ↓
    Is a third variant likely within 6 months?
    YES → Extract Strategy now (preparing for third is cheaper than refactoring after)
    NO → Keep inline (re-evaluate when third variant appears)
3-5 → Strategy pattern is warranted (conditional chain is already complex)
    ↓
    Are variants independent (each is a complete algorithm)?
    YES → Strategy pattern (each variant in its own class)
    NO → Template Method (shared structure with variant steps)
6+ → Strategy is mandatory (switch/if-else chain is unmaintainable)

How frequently do variants change?
RARELY → Strategy might be over-engineering — consider data-driven approach (config, enums)
FREQUENTLY → Strategy pattern (new variant = new class, no modification of existing code)
    ↓
    Is OCP compliance important for this code area?
    YES → Strategy pattern (new strategy class, register, done)
    NO → Conditional may be acceptable if rarely modified

---

## Rationale

Strategy pattern is justified when the variant count exceeds 2 or when variants change frequently. For 2 variants, an inline conditional is clearer unless the third variant is confirmed. Each Strategy class encapsulates one variant, making the code OCP-compliant — new strategies are added without modifying existing code.

---

## Recommended Default

**Default:** Inline conditional for 1-2 variants. Strategy pattern for 3+ variants or when variants change frequently.

**Reason:** Inline conditionals are simpler for few variants. Strategy's abstraction pays off when the variant count or change frequency reaches the threshold where the conditional chain becomes a maintenance burden.

---

## Risks Of Wrong Choice

Strategy for 1 variant: premature abstraction, unnecessary class and interface. Inline for 6+ variants: unmanageable switch/if-else, violates OCP, high change cost. Strategy with wrong interface: new variants can't conform, interface must change.

---

## Related Rules

- Rule 1: Strategy eliminates conditional logic by delegating algorithm selection to the caller
- Rule 2: Extract Strategy when 3+ variants exist or new variants are added quarterly

---

## Related Skills

- Identify Strategy Candidates
- Refactor Conditional to Strategy

---

## Decision: Strategy Interface Design — Broad vs Narrow

---

## Decision Context

Choose how many methods the Strategy interface should have.

---

## Decision Criteria

* performance considerations: interface breadth doesn't affect performance
* architectural considerations: narrow interfaces follow ISP; broad interfaces may couple unrelated operations
* security considerations: narrow interfaces limit what a strategy can access
* maintainability considerations: narrow interfaces are easier to implement; broad interfaces force boilerplate

---

## Decision Tree

Does the strategy need multiple operations to fulfill its contract (initialize, execute, cleanup)?
↓
YES → Is the multi-method contract always used in the same sequence?
    YES → Broad interface with lifecycle methods (more cohesive for multi-step strategies)
    ↓
    Example: `PaymentGateway::authorize()`, `capture()`, `refund()`, `void()`
    ↓
    Are all methods needed by all callers?
    YES → Broad interface is cohesive (all methods related to payment lifecycle)
    NO → Split into role interfaces (`Authorizable`, `Capturable`, `Refundable`)
    NO → Single-method interface (narrow — simplest)
NO → Can the strategy's purpose be expressed as a single method?
    YES → Single-method interface (`execute()`, `handle()`, `process()`)
    ↓
    Use PHP 8 union types or DTOs for parameters
    ↓
    Name the method to reflect the operation (not generic `execute()`)
    NO → Multiple methods may be needed — evaluate if they form a cohesive contract

---

## Rationale

Strategy interfaces should follow ISP — each client depends only on the methods it needs. However, multi-step strategies (payment gateway with authorize/capture/refund) benefit from a cohesive interface grouping lifecycle methods. Split into role interfaces if different callers use different subsets.

---

## Recommended Default

**Default:** Single-method strategy interface (e.g., `handle(Input): Output`). Multi-method only for lifecycle-bound operations (authorize → capture → refund).

**Reason:** Single-method interfaces are the easiest to implement, compose, and test. Multi-method interfaces are justified only when the methods form a cohesive lifecycle that is always used together.

---

## Risks Of Wrong Choice

Broad interface with unrelated methods: implementors throw `NotImplementedException`, ISP violation. Single-method for lifecycle operations: caller must manage sequence manually, no contract enforcement. Interface leaking strategy-specific types: coupling callers to strategy-specific DTOs.

---

## Related Rules

- Rule 3: Strategy interface should have one method unless lifecycle operations require more
- Rule 4: Name the strategy method by the operation, not the pattern (not `execute()`)

---

## Related Skills

- Design Strategy Interface
- Apply Role Interface Pattern

---

## Decision: Strategy Selection — Factory vs Service Container Tags vs Client-Side Switch

---

## Decision Context

Choose how to select the correct strategy implementation at runtime.

---

## Decision Criteria

* performance considerations: tagged services is O(1); factory adds switch logic; client-side selection may duplicate logic
* architectural considerations: tagged services are most OCP-compliant; factory centralizes selection
* security considerations: tagged services prevent selection bypass; client-side selection may use wrong strategy
* maintainability considerations: tagged services need no modification for new strategies; factory needs map update

---

## Decision Tree

Is the strategy selection key known at composition time (payment type, notification channel)?
↓
YES → Use Laravel tagged services (most OCP-compliant)
    ↓
    Register strategies with a shared tag in service provider
    Resolve all tagged strategies, select by key
    ↓
    Is the selection logic reusable across the application?
    YES → Centralized selector class (injects tagged services, exposes `select(key)` method)
    ↓
    The selector iterates tagged services, finds the one matching the key
    NO → Client-side selection using the tagged service list
    NO → Can the strategy key be derived from context (config, request, user preference)?
        YES → Centralized selector with context-based resolution
        ↓
        Selector uses config or request data to determine the key, then selects strategy
        NO → Factory pattern with explicit switch/map
            ↓
            Factory centralizes the selection — one place to update when new strategy added
            ↓
            Is the factory map driven by configuration?
            YES → Config-driven factory (new strategy = config change only)
            NO → Factory with switch/map (requires code change for new strategies)

---

## Rationale

Laravel tagged services provide the most OCP-compliant strategy selection — new strategies are added by creating a class and registering the tag, without modifying any existing selection code. A centralized selector class provides reusable selection logic. Factory patterns are appropriate when selection involves complex logic beyond key matching.

---

## Recommended Default

**Default:** Laravel tagged services with a centralized selector class. Factory pattern only when selection involves complex logic (not just key matching).

**Reason:** Tagged services require zero modification of existing code for new strategies. Centralized selector prevents selection logic duplication. Factory is a fallback for complex selection rules.

---

## Risks Of Wrong Choice

Client-side selection: duplication of selection logic, inconsistent strategy mapping, missing new strategies. Factory with hard-coded switch: violates OCP (must modify for each new strategy). Tagged services without selector: each client iterates and selects independently, duplication.

---

## Related Rules

- Rule 5: Use Laravel service container tagging for strategy registration
- Rule 6: Centralize strategy selection in a selector class, not in each client

---

## Related Skills

- Configure Tagged Services
- Design Strategy Selector
- Apply Factory for Strategy Creation
