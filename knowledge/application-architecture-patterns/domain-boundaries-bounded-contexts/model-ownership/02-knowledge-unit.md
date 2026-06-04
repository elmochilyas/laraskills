# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Eloquent model ownership per context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Each Eloquent model belongs to exactly one bounded context. The "User" model in Identity is not the same as the "User" reference in Billing. Context A never accesses Context B's models directly—it communicates through contracts or events. This prevents the common anti-pattern of a shared `User` model that all contexts couple to. Model ownership is the database-level expression of bounded context boundaries.

---

# Core Concepts

**Owned model:** The context that defines the model's schema, behavior, and lifecycle. Only the owning context creates, updates, or deletes the model's records.

**Referenced model:** Another context that refers to the owned model's data, but doesn't own it. Referencing happens through IDs or cached duplicates, not through direct model access.

**Shared model anti-pattern:** An `App\Models\User` used by all contexts. Changes to User's schema affect every feature in every context.

---

# Mental Models

**The "Exclusive Ownership" model:** Each database table has exactly one owner. The owning context's service provider runs the migrations. Other contexts never directly query the table.

**The "Reference by ID, Not by Model" model:** Context B stores User IDs from Context A but doesn't import Context A's User model. It queries through Context A's service if it needs user details.

---

# Internal Mechanics

Per-context model structure:
```
app/Domains/Identity/Models/
    User.php          — owns users table
    Role.php          — owns roles table

app/Domains/Billing/Models/
    Invoice.php       — owns invoices table
    Payment.php       — owns payments table
    UserReference.php — NOT a User model, just stores identity_id
```

---

# Patterns

**Local user reference:** Instead of using the `User` model from Identity context, the Billing context maintains its own customer reference with only the data it needs:
```php
// Billing's customer reference (not the User model)
class Customer extends Model {
    public $fillable = ['identity_user_id', 'stripe_customer_id', 'email'];
}
```

**Event-based synchronization:** When Identity creates a user, it dispatches `UserCreated`. Billing listens and creates a local `Customer` record.

---

# Architectural Decisions

**Own models per context when:** The context has distinct data ownership, the model is genuinely specific to the context, or you need independent schema evolution.

**Share model when:** The model is truly cross-cutting (like a system-wide User), all contexts agree on the schema, and independent evolution isn't required.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Independent schema evolution | Data duplication across contexts | Customer email stored in Identity AND Billing |
| No cross-context model coupling | Synchronization overhead | Event listeners to maintain copies |
| Clear data ownership | Cross-context queries require API calls | No JOINs across context tables |

---

# Common Mistakes

**One User model to rule them all:** A single `User` Eloquent model used by every context. Adding a profile picture field triggers migrations for all contexts.

**Cross-context model relationships:** `Invoice belongsTo User` where User is defined in a different context. This creates schema-level coupling.

**Model references without ownership:** A context that reads but never writes to another context's table still has implicit coupling.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Context identification | DBC-06 Schema per context | MMD-13 Database schema ownership |
| DBC-03 Shared kernel | DBC-07 Cross-context queries | DBC-08 Evolutionary boundaries |

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
