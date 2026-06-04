# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** SOLID principles in PHP: OCP violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Conditional replacement strategy — strategy pattern vs pipeline vs events
* Decision 2: Abstraction timing — when to introduce OCP-compliant abstractions
* Decision 3: Strategy selection and registration — tagged services vs factory vs registry

---

# Architecture-Level Decision Trees

---

## Decision: Conditional Replacement Strategy — Strategy Pattern vs Pipeline vs Events

---

## Decision Context

Choose how to replace switch/if-else chains that violate the Open-Closed Principle.

---

## Decision Criteria

* performance considerations: strategy is fastest (direct dispatch); pipeline adds overhead per stage; events are slowest
* architectural considerations: strategy is simplest; pipeline chains multiple processors; events decouple producer from consumer
* security considerations: events can leak internal details to unauthorized listeners; strategy keeps selection encapsulated
* maintainability considerations: strategy requires explicit selection; pipeline is composable; events are hardest to trace

---

## Decision Tree

Does the conditional chain select one implementation from many options?
↓
YES → Strategy pattern (primary OCP tool)
    ↓
    Are implementations mutually exclusive (one type → one handler)?
    YES → Strategy pattern with simple selection (map or tagged services)
    ↓
    Is the selection key known at composition time (e.g., payment gateway type)?
    YES → Strategy pattern injected via container tags (most maintainable)
    NO → Strategy pattern with runtime factory selection
    NO → Pipeline or chain of responsibility (multiple handlers may process)
NO → Does the chain process the same input through multiple stages?
    YES → Pipeline pattern (each stage transforms the input)
    ↓
    Do stages need to run in a specific order?
    YES → Pipeline with ordered stages (define order at composition time)
    NO → Event-based processing (each listener handles independently)
NO → Are the variants triggered by application events (new user registered, order placed)?
    YES → Events/listeners (decoupled, Open for extension via new listeners)
    ↓
    Does the event need a response or can listeners fire-and-forget?
    Response needed → Pipeline (chain processes in order and returns result)
    Fire-and-forget → Events (best OCP compliance — new listener = new feature, no modifications)

---

## Rationale

Strategy pattern is the primary tool for OCP compliance — it replaces conditional selection with polymorphic dispatch. Pipeline pattern is for sequential processing stages. Events are for decoupled side effects. Choose based on the relationship between variants: exclusive (strategy), sequential (pipeline), or independent (events).

---

## Recommended Default

**Default:** Strategy pattern with tagged services for type-based selection. Pipeline for multi-stage processing. Events for side effects and cross-context communication.

**Reason:** Strategy pattern directly addresses the most common OCP violation (switch/if-else on type). Pipeline and events are specialized tools for specific relationship patterns.

---

## Risks Of Wrong Choice

Strategy for sequential processing: misses the pipeline composition benefit. Events for exclusive selection: event system overhead for what should be a direct call. Pipeline for independent processors: unnecessary ordering constraint, harder to add/remove stages.

---

## Related Rules

- Rule 1: Classes should be open for extension but closed for modification
- Rule 2: Replace switch/if-else on type with strategy pattern

---

## Related Skills

- Apply Strategy Pattern
- Implement Pipeline Pattern
- Design Event-Driven Extension Points

---

## Decision: Abstraction Timing — When to Introduce OCP-Compliant Abstractions

---

## Decision Context

Choose when to extract an interface or strategy abstraction — before the second variant exists (proactive) or after the second variant emerges (reactive).

---

## Decision Criteria

* performance considerations: premature abstraction has no performance cost but adds maintenance overhead
* architectural considerations: proactive abstraction may be wrong; reactive abstraction is YAGNI-compliant
* security considerations: abstractions can be injection points for security middleware
* maintainability considerations: premature abstraction adds indirection without value; reactive abstraction requires refactoring

---

## Decision Tree

Does a second variant of this behavior already exist or is confirmed on the roadmap?
↓
YES → Extract abstraction now (third variant will be cheap to add)
    ↓
    Is the interface stable (unlikely to change when third variant is added)?
    YES → Proceed with extraction (interface won't need modification)
    NO → Delay extraction until the interface stabilizes (premature abstraction)
NO → Is this behavior determined by a type field that already has multiple values?
    YES → Some values have implementations, others don't — extract abstraction for existing implementations
    ↓
    Do all existing type values have the same processing (no switch needed yet)?
    YES → Wait for second variant before extracting (YAGNI)
    NO → Extract abstraction (the switch already exists — it will grow)
NO → No OCP violation exists yet — don't create abstraction (YAGNI)
    ↓
    Is the switch/conditional likely to grow (new types expected quarterly)?
    YES → Consider abstraction (cost of refactoring later > cost of abstraction now)
    NO → Keep simple conditional (re-evaluate when second variant emerges)

---

## Rationale

The industry-recommended approach is reactive abstraction: introduce the strategy interface when the second variant emerges. Premature abstraction is the most common OCP mistake — creating interfaces for single implementations adds indirection without value. However, if the switch/conditional already exists and is expected to grow, extraction is justified.

---

## Recommended Default

**Default:** Extract abstraction when the second concrete variant emerges. Don't create strategy interfaces for single implementations.

**Reason:** Premature abstraction adds unnecessary indirection. Waiting for the second variant ensures the interface is shaped by real requirements. The refactoring cost of extracting later is low with modern IDEs.

---

## Risks Of Wrong Choice

Premature abstraction: interface for single implementation, YAGNI violation, over-engineering. Never abstracting: switch/if-else chains grow indefinitely, OCP violation becomes costly to fix. Wrong interface: extracting before knowing the real abstraction leads to interface changes when second variant arrives.

---

## Related Rules

- Rule 3: Extract abstractions when the second variant emerges — not before
- Rule 4: Focus OCP on areas that change frequently, not on stable code

---

## Related Skills

- Assess Abstraction Timing
- Refactor Switch to Strategy

---

## Decision: Strategy Selection and Registration — Tagged Services vs Factory vs Registry

---

## Decision Context

Choose how to register and select strategy implementations at runtime.

---

## Decision Criteria

* performance considerations: tagged services is fastest (container-resolved); factory adds method call; registry adds array lookup
* architectural considerations: tagged services are most maintainable (auto-discovery); factory centralizes selection logic
* security considerations: tagged services prevent unauthorized strategy injection (controlled by container)
* maintainability considerations: tagged services need no modification for new strategies; factory needs switch update

---

## Decision Tree

Does Laravel's service container support tagging for this strategy type?
↓
YES → Use tagged services (most OCP-compliant — new strategy = new class + tag)
    ↓
    Is the selection key derivable from the class name (PaymentGateway\Stripe → 'stripe')?
    YES → Tagged services with convention-based key resolution (fully automatic)
    ↓
    Can the selection key be stored in the strategy class (static method or attribute)?
    YES → Tagged services with self-registration (most maintainable)
    NO → Tagged services with explicit map in service provider
    NO → Tagged services with explicit map in service provider (one modification per new strategy)
NO → Use factory pattern with a map (centralizes selection but requires modification for new strategies)
    ↓
    Is the factory map driven by configuration?
    YES → Config-driven factory (new strategy = add config entry, no code change in factory)
    NO → Switch-based factory (least OCP-compliant — must modify factory for each new strategy)
    ↓
    Can the switch be replaced with a tagged services approach?
    YES → Refactor to tagged services (restore OCP compliance)
    NO → Keep factory but monitor for change frequency

---

## Rationale

Laravel's tagged services provide the most OCP-compliant strategy registration — new strategies are added by creating a new class and registering the tag, without modifying any existing code. Factory patterns with maps or switches require modification of the factory when new strategies are added, violating OCP at the factory level. Config-driven factories are a middle ground.

---

## Recommended Default

**Default:** Laravel tagged services with convention-based key resolution. Config-driven factory when the strategy map must be environment-specific (e.g., different payment gateways per environment).

**Reason:** Tagged services require zero modification of existing code to add new strategies, achieving true OCP compliance. Config-driven factories provide flexibility for environment-specific strategy selection.

---

## Risks Of Wrong Choice

Switch-based factory: violates OCP at the factory level (must modify for each new strategy). Tagged services with wrong convention: strategies aren't discovered, runtime errors. No centralized registry: strategies are instantiated ad-hoc, selection logic duplicated across the codebase.

---

## Related Rules

- Rule 2: Replace switch/if-else on type with strategy pattern
- Rule 5: Use Laravel's service container tagging for strategy registration

---

## Related Skills

- Implement Tagged Services in Laravel
- Design Strategy Factory
- Apply Config-Driven Strategy Selection
