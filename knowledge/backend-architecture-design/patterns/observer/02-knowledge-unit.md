# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Observer pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Observer defines a one-to-many dependency between objects so that when one object changes state, all dependents are notified and updated automatically. In Laravel, the event system (Events, Listeners, Subscribers) and Eloquent model events (creating, created, updating, updated, etc.) implement the Observer pattern throughout the framework. The pattern is essential for decoupling primary operations from side effects (logging, notifications, cache invalidation).

---

# Core Concepts

- Subject: maintains list of observers, provides attach/detach methods
- Observer: defines update interface for objects that should be notified
- ConcreteSubject: stores state of interest, notifies observers on change
- ConcreteObserver: implements update interface to maintain consistency
- Push vs Pull: subject pushes event data vs observers pull what they need

---

# Mental Models

- **Mailing List**: Subscribers receive emails when author posts; subscribers can unsubscribe
- **Stock Ticker**: All screens update when stock price changes
- **Social Media Follow**: Followers get notified when user posts
- **Webhook**: External systems notified when event occurs

---

# Internal Mechanics

Laravel's event system (`Illuminate\Events\Dispatcher`) maintains a map of events to listeners. When an event is dispatched, the dispatcher loops through registered listeners and calls each. Listeners can be queued (ShouldQueue). Eloquent events fire based on model lifecycle hooks — the model's `fireModelEvent()` is called in `save()`, `delete()`, etc. Subscribers can register multiple event handlers in one class.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Laravel Event/Listener | Loose coupling of side effects | Decoupled by event name, async possible | Event → listener discovery is implicit |
| Eloquent Model Events | Hook into model lifecycle | No manual observer registration | Events coupled to model changes |
| SplObserver/SPL | Standard PHP observer | Language-native, no framework | Less flexible, no queuing |
| Reactive Observer | Event streaming | Real-time updates | Complexity of streaming infrastructure |

---

# Architectural Decisions

- Use for: side effects that follow primary operations (logging, emails, cache invalidation)
- Use for: domain events that multiple bounded contexts need to react to
- Use for: decoupling core logic from infrastructure concerns
- Queue listeners for: slow/non-critical side effects (email, report generation)
- Avoid for: operations that must complete in same transaction
- Avoid for: operations that must execute in specific order with guarantees

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples primary operation from side effects | Side effects are implicit | New devs may not know what happens when event fires |
| Easy to add new listeners without modifying subject | Listener execution order undefined (unless prioritized) | Race conditions between listeners |
| Queued listeners for slow operations | Eventual consistency | Data may be stale between event → listener execution |
| Testable in isolation | Testing full event chain requires integration tests | Individual listener tests pass, chain fails |

---

# Performance Considerations

- Synchronous listeners block the main process until complete
- Queue listeners: dispatch to queue adds ~1-5ms for serialization + dispatch
- Too many listeners per event increases response time
- Memory: each event carries payload; large payloads with many listeners consume memory
- Horizon: batch dispatch of queued events for throughput

---

# Production Considerations

- Monitor event dispatch counts and listener execution time
- Log listener failures (don't silence exceptions in listeners)
- Set queue connection per listener type (high vs low priority)
- Test that listener failures don't crash the main process
- Version events when payload changes between deployments

---

# Common Mistakes

- Synchronous listener doing heavy I/O → blocks response time
- Listener modifying the same data the event originated from → conflicts, circular events
- Not handling listener exceptions → unhandled exception crashes the request
- Too many events/liteners → application becomes hard to reason about
- Event payload containing entire objects → serialization issues, coupling

---

# Failure Modes

- **Listener exception crashes main process**: if not caught, exception in sync listener aborts request
- **Circular event loop**: event → listener fires another event → infinite loop
- **Stale listener**: event dispatched before new listener registered → side effect missed
- **Queue listener fails silently**: job fails but no monitoring → side effect never happens
- **Ordering violation**: listener assumes another listener already ran

---

# Ecosystem Usage

- **Laravel Events**: `Illuminate\Events\Dispatcher` — core event/listener system
- **Eloquent Events**: `retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `trashed`, `forceDeleted`
- **Model Observers**: `observe()` method registers observer class
- **Laravel Horizon**: event dispatching for job lifecycle events
- **Laravel Reverb**: WebSocket events using Observer pattern for real-time broadcasting

---

# Related Knowledge Units

**Prerequisites**: Event-driven architecture basics | **Related**: Mediator (centralized control vs distributed notification), Domain Events (domain concept vs infrastructure), Pub/Sub (message broker vs in-process) | **Advanced**: Event sourcing event store, Outbox pattern for reliable dispatch, Projection rebuild from events

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

