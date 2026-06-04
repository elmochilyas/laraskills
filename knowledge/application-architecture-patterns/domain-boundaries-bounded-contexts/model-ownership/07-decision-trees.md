# Decision Trees: Eloquent Model Ownership Per Context

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Eloquent model ownership per context
- **Knowledge Unit ID:** DBC-05
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Shared model vs per-context model | Architecture | Model design |
| 2 | Cross-context relationship vs ID reference | Architecture | Cross-context data access |
| 3 | Event-based sync vs synchronous contract call | Architecture | Cross-context data sharing |

---

## Decision 1: Shared model vs per-context model

### Context
The most common Laravel mistake in multi-context architectures is a single `App\Models\User` used by every feature. This creates maximum coupling — adding a profile picture field for the Forum context triggers a database migration that affects Identity and Billing. Each context should own its own model representing the concept in its domain language.

### Decision Tree

```
Is the model used by only one bounded context?
├── YES → Model stays in that single context — no sharing needed
│   `app/Domains/Identity/Models/User.php`
└── NO (model used by multiple contexts)
    → Does each context use the same fields and meaning?
    ├── YES (all contexts need exact same data)
    │   → Is the model truly universal and stable?
    │   ├── YES → Consider shared kernel (but very rare)
    │   │   Only for foundational, immutable concepts
    │   └── NO → Split per context — they will diverge
    │       Identity's "User" has different fields than Billing's "Customer"
    └── NO (contexts need different subsets of data)
        → Each context owns its own model
        Identity defines User with auth fields
        Billing defines Customer with billing fields
        Forum defines Author with profile fields
```

### Rationale
Each context has a different perspective on the same real-world entity. In Identity, a User has `email`, `password`, and `last_login_at`. In Billing, a Customer has `credit_limit`, `payment_method`, and `tax_id`. These are different domain concepts with different lifecycles. A shared model forces all contexts to carry every field, creates migration coupling, and prevents independent evolution. Each context's model reflects its specific needs.

### Recommended Default
Each context owns its own model; no shared `App\Models\User`

### Risks
- Shared User model: schema changes affect all contexts, migration coordination
- Too many model variants: 5 models representing the same entity unnecessarily
- Missing local reference model: context stores only user ID but needs other user data

### Related Rules
- Each Eloquent model belongs to exactly one bounded context (DBC-05/05-rules.md)
- Reference cross-context data by ID, not by model (DBC-05/05-rules.md)
- Use event-based synchronization for cross-context data (DBC-05/05-rules.md)

### Related Skills
- Enforce Eloquent Model Ownership Per Bounded Context (DBC-05/06-skills.md)
- Organize Database Schema Per Context (DBC-06/06-skills.md)
- Handle Cross-Context Queries (DBC-07/06-skills.md)

---

## Decision 2: Cross-context relationship vs ID reference

### Decision Tree

```
Does Context A need to reference Context B's data?
├── NO → No cross-context reference needed — isolated model
└── YES → Cross-context reference needed
    Is an Eloquent relationship (belongsTo, hasMany) about to be used?
    ├── YES → Do NOT use Eloquent relationship
    │   Cross-context relationships create schema coupling
    │   Instead, store the foreign ID as a plain integer
    │   `$this->identity_user_id` — no FK constraint
    │   `$this->belongsTo(User::class)` — WRONG (cross-context)
    └── NO (already using plain ID)
        → Correct — maintain plain ID references
        How does Context A get Context B's data when needed?
        ├── Through Context B's service contract
        │   Correct — access through service, not direct query
        └── Direct table query
            Wrong — bypasses business logic and authorization
            Switch to service contract
```

### Rationale
`Invoice belongsTo User` where User lives in Identity creates a foreign key constraint across context boundaries. The Identity context can't change its schema without affecting Billing. Storing `identity_user_id` as a plain integer (without FK constraint) breaks this coupling. The Invoice model doesn't import the Identity User model. If Billing needs user details (email, name), it either creates a local projection via events or queries Identity's service contract. No Eloquent relationships across context boundaries.

### Recommended Default
Plain integer IDs for cross-context references; no cross-context Eloquent relationships

### Risks
- Cross-context belongsTo: schema coupling, FK constraint across boundaries
- Cross-context hasMany: querying another context's models directly
- Direct table access: bypasses owning context's business logic and authorization

### Related Rules
- Never use cross-context Eloquent relationships (DBC-05/05-rules.md)
- Reference cross-context data by ID, not by model (DBC-05/05-rules.md)
- Access cross-context data only through service contracts (DBC-05/05-rules.md)

### Related Skills
- Enforce Eloquent Model Ownership Per Bounded Context (DBC-05/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

---

## Decision 3: Event-based sync vs synchronous contract call

### Decision Tree

```
How frequently does Context A need Context B's data?
├── Frequently (every page load, list views, dashboards)
│   → Event-based sync with local projection
│   Store a local copy of needed fields in Context A's database
│   `Customer` model in Billing stores `email`, `name` from Identity
│   Sync via events: listen to `UserUpdated`, update local projection
│   Accepts eventual consistency (seconds/minutes of delay)
├── Occasionally (specific admin views, reports)
│   → Synchronous contract call is acceptable
│   Query Context B's service directly for current data
│   No local storage needed
└── Never (only needs the ID for association)
    → No data sharing needed — ID reference is sufficient
    Store only `identity_user_id` — request no data from Context B
```

### Rationale
Event-based synchronization provides fast local reads at the cost of eventual consistency. When a context frequently needs data from another context (e.g., Billing needs user email on every invoice), querying the owning context synchronously for every page load creates latency and availability coupling. A local projection that stores only needed fields and syncs via events is more performant. Synchronous contract calls are acceptable for occasional queries where eventual consistency is problematic.

### Recommended Default
Event-based sync with local projection for frequently needed data; synchronous for occasional needs

### Risks
- No local projection: synchronous calls for every page load — latency, coupling
- Stale data: local projection doesn't reflect recent changes — eventual consistency lag
- Too many events: syncing every field when only a few are needed — over-synchronization

### Related Rules
- Use event-based synchronization for cross-context data (DBC-05/05-rules.md)
- Generate local reference models with only needed fields (DBC-05/05-rules.md)
- Access cross-context data only through service contracts (DBC-05/05-rules.md)

### Related Skills
- Enforce Eloquent Model Ownership Per Bounded Context (DBC-05/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
