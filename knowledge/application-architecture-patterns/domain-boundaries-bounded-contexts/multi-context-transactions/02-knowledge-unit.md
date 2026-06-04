# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Multi-context transactions and saga patterns
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Multi-context transactions (spanning multiple bounded contexts) cannot use ACID transactions because each context owns its data independently. The solution is the Saga pattern: a sequence of local transactions where each step publishes an event that triggers the next step. If a step fails, compensating transactions undo previous steps. Sagas implement eventual consistency across contexts. Two types: choreographed (events trigger steps) and orchestrated (a coordinator manages steps).

---

# Core Concepts

**Saga:** A sequence of local transactions. Each step commits independently. If a step fails, compensating transactions undo the effects of previous steps.

**Choreographed Saga:** Each step publishes an event that triggers the next step. No central coordinator. Decentralized, but flow is harder to trace.

**Orchestrated Saga:** A central coordinator (saga manager) tells each step what to do and handles rollbacks. More centralized, better visibility.

---

# Mental Models

**The "Distributed Transaction" model:** ACID transactions don't work across context boundaries. Sagas provide "eventual atomicity"—all steps eventually complete or are compensated.

**The "Rollback with Compensation" model:** When a saga fails, you can't roll back the database. You run compensating operations that undo the effect (cancel invoice, refund payment, notify user).

---

# Internal Mechanics

```php
// Orchestrated Saga
class OrderSaga {
    public function execute(CheckoutData $data): void {
        DB::beginTransaction();
        try {
            $order = $this->createOrder($data);
            DB::commit();

            // Cross-context steps
            $payment = $this->processPayment($order);
            $this->reserveInventory($order);
            $this->notifyCustomer($order);

        } catch (\Exception $e) {
            // Compensating actions
            if (isset($payment)) $this->refundPayment($payment);
            if (isset($order)) $this->cancelOrder($order);
            throw $e;
        }
    }
}
```

---

# Patterns

**Choreographed Saga via events:**
1. Order Service creates order → dispatches `OrderCreated`
2. Billing Service listens, processes payment → dispatches `PaymentProcessed` or `PaymentFailed`
3. Inventory Service listens to `PaymentProcessed`, reserves inventory

**Orchestrated Saga with coordinator:**
1. Saga Manager sends `ProcessPayment` command to Billing
2. Saga Manager sends `ReserveInventory` command to Inventory
3. Saga Manager handles failures by sending compensating commands

**Compensating transaction table:** Track saga state in a `saga_states` table for recovery:
```php
Schema::create('saga_states', function (Blueprint $table) {
    $table->id();
    $table->string('saga_type'); // OrderSaga
    $table->string('status'); // running, completed, failed
    $table->json('state'); // serialized saga state
    $table->timestamps();
});
```

---

# Architectural Decisions

**Use Sagas when:** An operation spans multiple bounded contexts and must be "eventually consistent."

**Use ACID within a context:** Within a single bounded context, ACID transactions are fine. Sagas are for cross-context operations.

**Choose choreographed for:** Decentralized teams, simple workflows, when flow changes are rare.

**Choose orchestrated for:** Complex workflows with many failure paths, when central visibility is needed.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Choreographed | No central dependency | Flow is distributed, hard to trace |
| Orchestrated | Central visibility, error handling | Coordinator is a single point, more code |

---

# Common Mistakes

**Using ACID across contexts:** Attempting a distributed transaction across context databases. Expensive, fragile, and often impossible.

**No compensating transactions:** Designing a saga without compensation logic. If a step fails, the system is in an inconsistent state.

**Sagas for single-context operations:** Using saga patterns for operations that don't cross context boundaries. Over-engineering.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-07 Cross-context queries | DBC-12 Eventual consistency | CPC-10 Outbox pattern |
| CPC-02 Domain events | MMD-15 Event sourcing CQRS | CPC-09 Event sourcing |

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
