# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Eventual consistency across context boundaries
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Eventual consistency means that across bounded contexts, data will become consistent over time—but may be temporarily inconsistent. This is the price of context independence. The pattern: Context A commits a change and publishes an event. Context B receives the event and updates its own data asynchronously. Between the commit and the event processing, the data in Context B is stale. Engineering decisions center on: acceptable staleness window, conflict resolution, and detection of inconsistent states.

---

# Core Concepts

**Consistency window:** The time between Context A's commit and Context B's event processing. During this window, Context B has stale data.

**Idempotent event handling:** Events must be processable multiple times without side effects. If the same event is delivered twice, processing it twice produces the same state.

**Conflict resolution:** When two contexts' data conflict (e.g., both modify the same concept), a resolution strategy is needed: last-write-wins, version-based, or manual.

---

# Mental Models

**The "Stale Data is Temporary" model:** Eventually consistent systems accept that data may be stale for a brief period. Users see "saved" before cross-context processing is complete.

**The "Make it Work with Stale Data" model:** The user interface and business logic must function correctly even when cross-context data is slightly stale.

---

# Internal Mechanics

```php
class PaymentProjector {
    // Idempotent: running this twice produces the same result
    public function onPaymentReceived(PaymentReceived $event): void {
        PaymentReadModel::updateOrCreate(
            ['payment_id' => $event->paymentId],
            ['status' => 'completed', 'amount' => $event->amount]
        );
    }
}
```

---

# Patterns

**Idempotent projectors:** Event listeners that use `updateOrCreate` or check `if (already_processed) { return; }` before updating.

**Stale data detection:** Compare timestamps or version numbers to detect stale data:
```php
if ($local->updated_at < $event->timestamp) {
    // Event is newer, update local data
}
```

**Read-your-writes consistency:** When the user who initiated the change reads the data, ensure they see their own write immediately (bypass eventual consistency for the writer).

---

# Architectural Decisions

**Accept eventual consistency when:** The cross-context data doesn't need to be immediately consistent for correct behavior.

**Require strong consistency when:** An operation depends on another context's data being current. In a modular monolith, prefer synchronous calls for strong consistency needs.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Context independence | Data staleness window |
| No distributed transactions | Conflict resolution complexity |
| Resilience (context can be down) | Inconsistency detection overhead |

---

# Common Mistakes

**Assuming strongly consistent data:** Reading cross-context data without accounting for staleness. User sees old data.

**No staleness tolerance:** Building UIs that require cross-context data to be perfectly consistent. Adds complexity and defeats event-driven decoupling.

**No monitoring of inconsistency:** Not monitoring the average staleness window. Inconsistencies can grow silently.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-07 Cross-context queries | DBC-11 Multi-context transactions | CPC-09 Event sourcing |
| CPC-03 Sync vs queued events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

---

## Performance Considerations

Identifying bounded context boundaries adds negligible performance overhead at runtime. The cost is at design time: event storming sessions, context mapping workshops, and documentation. Once boundaries are identified, the performance characteristics depend on the communication pattern between contexts. Synchronous calls between contexts add network latency if services are separated. In a modular monolith, context boundaries add no runtime cost.

---

## Production Considerations

Bounded contexts must be enforced in production through CI checks (architecture tests, import rules). Without enforcement, boundaries degrade: cross-context direct model access creeps in, shared database tables emerge, and the bounded context becomes a folder boundary in name only. Production monitoring should track cross-context call volume and latency (if using service-level boundaries). Team ownership should align with context boundaries in production incident response.

---

## Failure Modes

**Leaky context boundary:** Other contexts directly access Eloquent models or database tables owned by a different context. The boundary exists in folder structure but not in runtime enforcement.

**Wrong boundary identification:** Splitting a domain where the concepts are tightly coupled causes transaction and consistency problems. The overhead of coordinating across the boundary exceeds the benefit of separation.

**Boundary erosion over time:** As the codebase evolves, changes naturally blur context boundaries. Regular architecture reviews and automated enforcement are required to maintain integrity.

---

## Ecosystem Usage

Event Storming (Alberto Brandolini) is the most popular technique for bounded context identification. The Context Mapper DSL provides tooling for context mapping. In the Laravel ecosystem, nwidart/laravel-modules and domain-based directory organization are the primary implementation approaches. Eric Evans Domain-Driven Design (2003) remains the definitive reference. Vaughn Vernons Implementing Domain-Driven Design provides practical implementation guidance.

---

## Research Notes

Research in 2025-2026 shows continued adoption of strategic DDD patterns in Laravel. The community consensus favors starting with coarse context boundaries and splitting later over premature fine-grained separation. The bounded context heuristic (language divergence, team alignment, data lifecycle) remains the standard identification approach. Anti-Corruption Layers are increasingly recognized as essential for legacy Laravel application integration.
