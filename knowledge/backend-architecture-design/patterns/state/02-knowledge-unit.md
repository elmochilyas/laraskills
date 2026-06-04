# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: State pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

State allows an object to alter its behavior when its internal state changes, appearing to change its class. In Laravel, state machines are commonly implemented for order workflows (pending → confirmed → shipped → delivered), approval processes, and subscription lifecycles. The pattern eliminates complex switch/if-else chains on state values by delegating state-dependent behavior to separate state objects.

---

# Core Concepts

- Context: maintains current state instance, delegates behavior to it
- State: interface defining state-specific behavior
- ConcreteState: implements behavior for a specific state
- State transitions: states define allowed transitions to other states
- Context delegates: behavior varies based on current ConcreteState

---

# Mental Models

- **Traffic Light**: Behavior depends on current state (green, yellow, red)
- **Vending Machine**: Same actions produce different results based on state (has money, no money, sold out)
- **Water**: Same H2O behaves differently at different temperatures (solid, liquid, gas)
- **Order Workflow**: Same `cancel()` call behaves differently per state (pending=cancel, shipped=return)

---

# Internal Mechanics

Context stores reference to current state object. Instead of if/else on state string/enum, context calls state's methods. Each state object implements transition logic to other states. PHP enums (8.1) can hold state behavior via methods, but full state pattern uses separate state classes for complex behavior. State transitions return new state instance.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Class-based State | Complex state behavior | Full behavior encapsulation | Many state classes (N states = N classes) |
| Enum-based State | Simple state transitions | Compact, type-safe | Limited behavior, state explosion risk |
| State Machine Library | Declarative workflow | Visualizable, auditable | External dependency, configuration-heavy |
| Table-driven State | Data-driven transitions | Configurable without code | Less type-safe, runtime errors |

---

# Architectural Decisions

- Use for: entities with lifecycle state changes (orders, subscriptions, approvals)
- Use for: workflows with guard conditions (can transit only if condition met)
- Use for: state-dependent validation rules
- Use for: audit-trail-required state transitions
- Avoid for: simple boolean flags — if/else or ternary is clearer
- Avoid for: states that don't affect behavior (just status labels)
- Use library for: complex workflows with many states and transitions (spatie/laravel-state-machine, sebastiaanluca/laravel-workflow)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates state-based conditionals | Many state classes | Navigation overhead |
| Single Responsibility per state | State transition logic spread across states | Hard to see full workflow at once |
| Adding new state doesn't modify existing | Must implement all state interfaces | New state may need empty methods |
| State transitions auditable | Transition validation duplicated | Inconsistent transition rules |

---

# Performance Considerations

- State object overhead: one instance per state (can be singleton if stateless)
- Method dispatch through state object: one extra indirection
- State transition: create new state object (cheap)
- Memory: state objects typically lightweight (no DB connections)

---

# Production Considerations

- Log state transitions with actor/timestamp for audit
- Guard against invalid transitions explicitly
- Consider persistence: store current state in DB column
- Test all possible transition paths, including invalid ones
- Document state machine with visual diagram (keep in repo)

---

# Common Mistakes

- State object holding context reference → tight coupling, GC issues
- Transitions spread across state objects → transition map hard to maintain
- Forgetting to handle invalid transitions → silent no-op (state doesn't change)
- State pattern used for simple boolean switches → overengineering
- State objects with mutable state → shared state object contaminated across contexts

---

# Failure Modes

- **Invalid transition**: action called in wrong state → undefined behavior or exception
- **Orphaned state**: entity reaches terminal state but cannot transition further → permanent lock
- **Missing initial state**: new entity created without initial state → all behaviors fail
- **State leak**: two contexts sharing same state instance → cross-entity state contamination
- **Transition loop**: A→B→A→B infinite loop due to cyclical transition rules

---

# Ecosystem Usage

- **Spatie/laravel-state-machine**: declarative state machine configuration with transitions, guards, callbacks
- **Spatie/laravel-model-states**: state pattern for Eloquent models with state transitions
- **Laravel native**: manual state pattern via enums + match/switch in application code
- **Workflow engines**: temporal.io, Symfony Workflow for complex multi-entity workflows

---

# Related Knowledge Units

**Prerequisites**: Polymorphism, Enums (PHP 8.1) | **Related**: Strategy (algorithm selection vs state-dependent behavior), Specification pattern (guards for transitions), State machine libraries | **Advanced**: State event sourcing (state changes as events), Hierarchical state machines, Finite state machine persistence

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

