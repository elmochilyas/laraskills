# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Anti-corruption layer pattern
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

An Anti-Corruption Layer (ACL) is a translation layer that prevents one context's domain model from corrupting another's. When Context A must integrate with Context B (or a legacy system), the ACL translates between B's model and A's model. The ACL ensures that changes in B (or the legacy system) don't propagate into A's model. This is the primary pattern for protecting bounded context integrity when integrating with external or legacy systems.

---

# Core Concepts

```
[Context A] → ACL → [Legacy System B]
    own model      translates       legacy model
```

The ACL:
- Translates B's model into A's model
- Translates A's commands into B's operations
- Isolates A from B's schema, API, and behavior changes
- Lives in A's boundary (A owns the translation)

---

# Mental Models

**The "Embassy" model:** An ACL is like an embassy in a foreign country. It translates between the host country's language (Context B) and the home country's language (Context A). The home country (A) doesn't need to learn the foreign language.

**The "Facade for Integrity" model:** The ACL provides a simplified interface that aligns with Context A's model while hiding the complexity of Context B.

---

# Internal Mechanics

```php
// Legacy system's model (we can't change this)
class LegacyOrder {
    public function getCustomerCode(): string;
    public function getTotalInCents(): int;
    public function getStatusFlag(): string; // 'N' = new, 'P' = paid, 'C' = cancelled
}

// ACL - translates to our model
class LegacyOrderTranslator {
    public function toDomain(LegacyOrder $legacy): Order {
        return new Order(
            id: new OrderId($legacy->getCustomerCode()),
            total: new Money($legacy->getTotalInCents(), 'USD'),
            status: OrderStatus::fromLegacyFlag($legacy->getStatusFlag()),
        );
    }
}

// ACL service - our context interacts with this
class LegacyOrderService implements OrderService {
    public function __construct(
        private LegacyOrderClient $client,
        private LegacyOrderTranslator $translator,
    ) {}

    public function findOrder(string $id): Order {
        $legacy = $this->client->fetchOrder($id);
        return $this->translator->toDomain($legacy);
    }
}
```

---

# Patterns

**Translator (two-way):** Converts between models. One class per external system, with `toDomain()` and `toExternal()` methods.

**Facade:** Simplifies the external system's interface. Hides multiple API calls behind a single method.

**Adapter:** Implements a port interface defined by the consuming context. The ACL is the adapter in Ports and Adapters terminology.

---

# Architectural Decisions

**Build ACL when:** Integrating with a legacy system that has a different domain model, or with an external system whose model would contaminate your bounded context.

**Skip ACL when:** The external system's model aligns closely with your context's model, or the integration is simple enough that direct translation in a service method suffices.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Protects context model integrity | Translation code overhead | Each legacy system needs an ACL class |
| Independent evolution of context | Must maintain both translations | Legacy changes may require ACL updates |
| Legacy system is swappable | ACL can become complex | Translation logic for deeply different models |

---

# Common Mistakes

**No ACL when one is needed:** Directly using legacy models in the current context. Legacy model changes break the context.

**ACL that exposes legacy detail:** Translation that doesn't fully protect the context. The domain model still shows traces of legacy schema.

**ACL that's too thin:** A pass-through that translates field names but not concepts. The domain model still reflects legacy thinking.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-02 Context mapping | DBC-10 Legacy integration | LAP-04 Dependency Rule |
| CPC-07 Bridge/adapter pattern | CPC-01 Interface contracts | DBC-08 Evolutionary boundaries |

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
