# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Eloquent model ownership per context
Knowledge Unit ID: DBC-05
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Each Eloquent model belongs to exactly one bounded context. The "User" model in Identity is not the same as the "User" reference in Billing. Context A never accesses Context B's models directly — it communicates through contracts or events. This prevents the common anti-pattern of a shared `User` model that all contexts couple to. Model ownership is the database-level expression of bounded context boundaries.

---

# Core Concepts

- **Owned model**: Context defines schema, behavior, lifecycle. Only owning context creates/updates/deletes records.
- **Referenced model**: Another context refers to owned model's data by ID or cached duplicate. No direct model access.
- **Shared model anti-pattern**: `App\Models\User` used by all contexts — schema changes affect every feature.

---

# When To Use

- Every multi-context architecture. Each model has exactly one owning context.

---

# When NOT To Use

- Single-context application (no cross-context model access concerns).

---

# Best Practices

- **Each database table has exactly one owner.** WHY: The owning context runs the migrations. Other contexts never directly query the table. This ensures independent schema evolution.
- **Reference by ID, not by Model.** WHY: Context B stores User IDs from Context A but doesn't import Context A's User model. It queries through Context A's service if user details are needed.
- **Avoid cross-context Eloquent relationships.** WHY: `Invoice belongsTo User` where User is in a different context creates schema-level coupling.
- **Use event-based synchronization for cross-context data.** WHY: When Identity creates a user, dispatch `UserCreated`. Billing listens and creates a local Customer record with only needed fields.

---

# Architecture Guidelines

- Each context has its own Models directory.
- A context's models reference other contexts' data by ID, not by importing their models.
- Cross-context model relationships are forbidden (belongsTo, hasMany across contexts).

---

# Performance Considerations

- Data duplication (storing email in both Identity and Billing) costs storage but enables independent evolution.

---

# Security Considerations

- Model ownership provides natural data access boundaries. Each context controls its own schema.

---

# Common Mistakes

1. **One User model to rule them all:** Single `User` model used by every context. Cause: convenience. Consequence: adding a profile picture field triggers migrations for all contexts. Better: each context owns its user representation.

2. **Cross-context model relationships:** `Invoice belongsTo User` where User is in different context. Cause: Eloquent habits. Consequence: schema coupling. Better: store identity_user_id as integer without FK constraint.

3. **Model references without ownership:** Context reads but never writes another context's table. Cause: performance shortcut. Consequence: still implicit coupling. Better: access through contracts.

---

# Anti-Patterns

- **Shared User model**: All contexts importing and depending on one App\Models\User.
- **Cross-context JOINs**: Query joining tables from different contexts.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Context identification | DBC-06 Schema per context | MMD-13 Database schema ownership |
| DBC-03 Shared kernel | DBC-07 Cross-context queries | DBC-08 Evolutionary boundaries |

---

# AI Agent Notes

- Each model belongs to exactly one context.
- Cross-context references use IDs, not model imports.
- Generate local reference models for cross-context data.

---

# Verification

- [ ] Each model belongs to exactly one bounded context
- [ ] No cross-context model imports (belongsTo, hasMany)
- [ ] Cross-context references use IDs, not foreign keys
- [ ] No shared User model across all contexts
- [ ] Event-based sync for cross-context data duplication
