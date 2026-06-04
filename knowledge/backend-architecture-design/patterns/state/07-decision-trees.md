# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** State pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: State pattern vs state machine library vs enum-based switch
* Decision 2: Transition management — state objects vs centralized state machine
* Decision 3: State object design — shared stateless vs per-context stateful

---

# Architecture-Level Decision Trees

---

## Decision: State Pattern vs State Machine Library vs Enum-Based Switch

---

## Decision Context

Choose how to implement state-dependent behavior — full State pattern, a state machine library, or simple switch on an enum.

---

## Decision Criteria

* performance considerations: enum switch is fastest; state pattern adds indirection; library adds abstraction overhead
* architectural considerations: state pattern is most flexible; enum switch is simplest; library provides guardrails
* security considerations: state machine libraries enforce allowed transitions; enum switch does not
* maintainability considerations: state pattern and libraries scale better than enum switch as states grow

---

## Decision Tree

How many states and transitions exist?
↓
2 STATES, 1-2 TRANSITIONS → Enum-based switch (simple boolean or status field)
3-5 STATES, 5-10 TRANSITIONS → Consider State pattern or state machine library
    ↓
    Does the behavior change significantly per state (different logic per state)?
    YES → State pattern (behavioral encapsulation per state)
    ↓
    Are transitions complex with guards and side effects?
    YES → State machine library (enforces transition rules, prevents invalid transitions)
    ↓
    Use packages like `spatie/state` or custom state machine
    NO → State pattern with manual transition methods
    NO → Enum with switch is still manageable for simple branching
6+ STATES, 10+ TRANSITIONS → State machine library or State pattern (switch doesn't scale)
    ↓
    Does the application need state transition visualization or audit?
    YES → State machine library (often provides these features)
    NO → State pattern (more control, less dependency)

---

## Rationale

For 2-state systems (active/inactive), an enum or boolean is sufficient. For 3-5 states, the State pattern or a state machine library is warranted depending on transition complexity. Libraries provide guard enforcement and transition validation. The State pattern gives more control over per-state behavior.

---

## Recommended Default

**Default:** Enum/boolean for 2 states. State pattern for 3-5 states with behavioral differences. State machine library for 6+ states or complex transition rules.

**Reason:** The pattern's overhead is justified by the state count and behavioral complexity. Simple states don't need the pattern; complex states benefit from structured state objects or library enforcement.

---

## Risks Of Wrong Choice

Enum switch for 6+ states: unmaintainable switch statement, no transition validation, behavior scattered. State pattern for 2 states: over-engineering, too many classes for simple logic. No transition guards: invalid state transitions reach production.

---

## Related Rules

- Rule 1: State pattern eliminates switch/if-else on state values by delegating behavior to state objects
- Rule 2: Use State pattern when behavior changes significantly per state

---

## Related Skills

- Implement State Pattern
- Use Spatie State Machine

---

## Decision: Transition Management — State Objects vs Centralized State Machine

---

## Decision Context

Choose whether transitions are managed by state objects themselves or by a centralized state machine.

---

## Decision Criteria

* performance considerations: centralized machine is slightly faster (single dispatch); state objects add delegation overhead
* architectural considerations: centralized machine provides single transition authority; state objects distribute transition logic
* security considerations: centralized machine enforces all transition rules in one place
* maintainability considerations: centralized machine is easier to audit; state objects are easier to add

---

## Decision Tree

Are transition rules simple (each state knows what it can transition to)?
↓
YES → State objects can manage their own transitions
    ↓
    Does each state object return the next state from its transition method?
    YES → State-managed transitions (each state knows its valid next states)
    ↓
    Example: `PendingOrder::approve()` returns `ConfirmedOrder`
    `ConfirmedOrder::ship()` returns `ShippedOrder`
    ↓
    Are there cross-cutting transition rules (can't ship if payment is pending)?
    YES → Centralized state machine (cross-state rules are hard to enforce in individual state objects)
    NO → State-managed transitions are acceptable
    NO → Centralized state machine (complex rules require single authority)
NO → Are there global guards (any transition requires auth check, logging, validation)?
    YES → Centralized state machine with middleware/pre/post hooks
    ↓
    Central machine checks guards before allowing any transition
    ↓
    Each guard is a separate concern (auth, validation, logging)
    NO → State-managed transitions (each state handles its own pre/post conditions)

---

## Rationale

State-managed transitions (each state object returns the next state) is simpler and more aligned with the State pattern. Centralized state machines are better for complex cross-cutting rules, audit requirements, and global guards. The choice depends on whether transition rules are per-state (state-managed) or global (centralized).

---

## Recommended Default

**Default:** State-managed transitions for simple workflows (<5 states, simple rules). Centralized state machine for complex workflows with cross-cutting guards.

**Reason:** State-managed transitions are simpler and maintain state encapsulation. Centralized machines provide better audit and enforcement for complex rule sets. Start with state-managed, extract to centralized when cross-cutting guards emerge.

---

## Risks Of Wrong Choice

State-managed with global rules: guard logic duplicated across state objects, missing guards on some transitions. Centralized for simple workflow: unnecessarily complex, state objects become anemic, transition logic is far from state definitions.

---

## Related Rules

- Rule 4: State objects define valid transitions; guards are applied before transition execution
- Rule 5: Use centralized state machine for complex, cross-cutting transition rules

---

## Related Skills

- Design State Transitions
- Implement Centralized State Machine

---

## Decision: State Object Design — Shared Stateless vs Per-Context Stateful

---

## Decision Context

Choose whether state objects are shared singletons (no per-state mutable data) or created per context (stateful).

---

## Decision Criteria

* performance considerations: shared singletons save memory; per-context instances add allocation overhead
* architectural considerations: shared state objects must be immutable; per-context objects can hold context
* security considerations: shared objects must not hold mutable context to prevent data leakage
* maintainability considerations: shared objects are simpler; per-context objects are clearer for complex state

---

## Decision Tree

Does the state need to hold context-specific data (the Order ID being processed)?
↓
YES → Per-context stateful objects (each state object receives the context it operates on)
    ↓
    Is the application running in Octane (long-lived processes)?
    YES → Ensure state objects are created per request, not shared
    ↓
    Bind state objects as `scoped()` in container, or create fresh per operation
    NO → Per-context instances created per operation (OK, PHP-FPM frees them)
NO → Is the state logic purely behavioral (no mutable data, pure methods)?
    YES → Shared stateless objects (single instance, immutable behavior)
    ↓
    Register as singleton in container (safe if stateless)
    All state-dependent data comes from the context object passed as parameter
    ↓
    Example: `PendingOrderState::approve($order)` — state is stateless, order context is passed
    NO → State needs internal data — create per-context instances

---

## Rationale

Stateless state objects can be shared as singletons — they only define behavior, and the context (order, document) is passed as a parameter. Stateful objects need per-context instances because they hold mutable state. The default should be stateless, passing the context as a method parameter.

---

## Recommended Default

**Default:** Stateless state objects with context passed as a method parameter. Per-context instances only when state objects need to hold mutable data.

**Reason:** Stateless singletons save memory, are safe in long-lived processes, and cleanly separate state behavior from context data. Stateful objects risk data leakage in Octane and complicate lifecycle management.

---

## Risks Of Wrong Choice

Shared stateful objects: data contamination between contexts in Octane, unexpected behavior. Per-context stateless objects: unnecessary allocation, memory waste in high-throughput scenarios. State object modifying context without returning: side-effect-driven design is harder to test.

---

## Related Rules

- Rule 6: Prefer stateless state objects — pass context as method parameters
- Rule 3: State objects should not hold mutable shared state

---

## Related Skills

- Design Stateless State Objects
- Manage State Object Lifecycle in Octane
