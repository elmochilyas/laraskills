# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Integrating legacy systems at context boundaries
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Legacy integration at context boundaries uses the Anti-Corruption Layer (ACL) and Strangler Fig patterns to isolate the new system from legacy contamination. The ACL translates between legacy and new domain models. The Strangler Fig gradually replaces legacy functionality by routing specific features to the new system. The goal is to protect the new bounded context's model integrity while incrementally replacing the legacy system.

---

# Core Concepts

**Anti-Corruption Layer:** Translates between legacy model and new context model. Prevents legacy terminology and schema from leaking into the new system.

**Strangler Fig:** Incrementally replaces legacy functionality. Route new features to the new system. When all features are migrated, retire the legacy system.

**Legacy model isolation:** The new context never imports legacy classes directly. All interaction goes through the ACL.

---

# Mental Models

**The "Buffer Zone" model:** The ACL is a buffer between the legacy system (chaotic, undisciplined) and the new system (clean, well-structured). The buffer absorbs the legacy impact.

**The "Gradual Replacement" model:** You don't replace a legacy system in one weekend. You intercept calls, route some to the new system, and expand the routes until the legacy system has nothing left.

---

# Internal Mechanics

```php
// ACL for legacy system integration
class LegacyCrmAcL {
    public function __construct(
        private LegacyCrmClient $legacy,
        private CustomerTranslator $translator,
    ) {}

    public function findCustomer(string $id): Customer {
        $legacyCustomer = $this->legacy->fetchCustomer($id);
        return $this->translator->toDomain($legacyCustomer);
    }

    public function syncCustomer(Customer $customer): void {
        $legacyData = $this->translator->toLegacy($customer);
        $this->legacy->updateCustomer($legacyData);
    }
}
```

---

# Patterns

**Strangler Fig route by route:** Feature-flag based routing. New features go to new system. Old features stay on legacy. When a feature is migrated, the flag is removed.

**Write-through + read-through ACL:** Commands go to both systems (legacy + new). Reads come from new system. Verifies correctness during migration.

**Legacy facade:** A service that wraps the legacy system's API, providing a clean interface for the new context.

---

# Architectural Decisions

**Build ACL when:** The legacy system has a fundamentally different model that would corrupt the new context.

**Use Strangler Fig when:** The legacy system is large and cannot be replaced in one effort. Feature-by-feature replacement is the only safe approach.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| New context model stays clean | ACL maintenance overhead | Legacy API changes require ACL updates |
| Incremental replacement | Dual operation cost | Both systems run during migration |
| Migration risk is contained | Migration takes months/years | Long transition period |

---

# Common Mistakes

**No ACL:** Importing legacy models directly into the new context. Legacy schema decisions infect the new domain model.

**Strangler Fig without ACL:** The strangler replaces functionality but passes legacy data structures through. The new system inherits legacy data model problems.

**Full rewrite attempt:** Trying to replace the entire legacy system at once. High risk of failure, long period without shipping.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-04 Anti-corruption layer | DBC-11 Multi-context transactions | DBC-12 Eventual consistency |
| MMD-11 Module extraction | CPC-07 Bridge/adapter pattern | AEG-09 Refactoring remediation |

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
