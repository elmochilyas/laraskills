# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Transaction boundaries in layered architecture
Knowledge Unit ID: LAP-11
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Transaction boundaries in layered architecture answer: where does `DB::transaction()` belong? The consensus places transactions in the Application layer (Use Case/Service level), not in Controllers (Presentation) and not in Repositories (Infrastructure). Controllers should not manage transactions (they are HTTP concerns). Repositories should not (they must be composable). The Application layer coordinates the boundary.

---

# Core Concepts

- **Unit of Work**: A transaction covers one meaningful business operation. "Register user" (create user + send welcome email + create workspace) is a unit of work.
- **All or Nothing**: If part of the operation can fail acceptably while another part succeeds, either the boundary is wrong or eventual consistency is needed.
- **Service Layer Owns Transactions**: The orchestration layer understands which operations belong together.

---

# When To Use

- Operations spanning multiple repository calls that must be atomic
- Business operations with side effects (events, external API calls) needing rollback on failure
- Any write operation involving multiple aggregate roots

---

# When NOT To Use

- Read-only queries — no transaction needed
- Single-table operations with no side effects
- Operations where eventual consistency is acceptable instead of atomicity

---

# Best Practices

- **Place transactions in Use Case/Service layer.** WHY: Controllers should not manage DB concerns; repositories should remain composable. The orchestration layer knows the full scope of the business operation.
- **Move external API calls outside the transaction.** WHY: External API calls can't be rolled back and may hold the transaction open, causing long-lived locks. Do API calls after commit.
- **Avoid nested transactions.** WHY: Laravel's nested `DB::transaction()` uses savepoints — inner rollback doesn't roll back the outer transaction. This creates confusing behavior.
- **Use consistent table access ordering** within transactions. WHY: Prevents deadlocks when two transactions wait for each other's locks.
- **Monitor transaction duration.** WHY: Long transactions hold database connections and locks. Track duration with custom middleware or event listeners.

---

# Architecture Guidelines

- Wrong: Transactions in Controllers. Right: Transactions in Use Cases.
- Wrong: Each Repository method wraps its own transaction. Right: Repository methods participate in the Use Case's transaction.
- Wrong: `DB::transaction()` wrapping external API calls. Right: API calls after transaction commit.
- Repository-level transactions are acceptable for genuinely standalone operations (single aggregate root, no cross-aggregate consistency).

---

# Performance Considerations

- Long-lived transactions hold database connections and locks.
- External API calls within transactions should be extracted to after-commit jobs.
- Set appropriate isolation levels: `READ COMMITTED` for most scenarios, `SERIALIZABLE` with retry logic for high contention.

---

# Security Considerations

- Transactions do not provide security guarantees — they ensure data consistency.
- Ensure authorization checks happen before transaction begins, not within it.

---

# Common Mistakes

1. **Transactions in controllers:** Controller manages transaction. Cause: convenience. Consequence: every delivery mechanism needs its own transaction management. Better: centralize in Application layer Use Case.

2. **Transactions in repositories:** Repository wraps own transaction. Cause: defensive programming. Consequence: Use Case calling three repositories has three separate transactions. Better: repository participates in caller's transaction.

3. **Transactions spanning disparate systems:** `DB::transaction()` wrapping database writes AND external API calls. Cause: trying to make API calls atomic. Consequence: API calls can't be rolled back; transaction held open. Better: dispatch after-commit events/jobs.

4. **Deadlocks from inconsistent ordering:** Two transactions accessing tables in different orders. Cause: no convention. Consequence: deadlock. Better: always access tables in same order within transactions.

---

# Anti-Patterns

- **Distributed transaction simulation**: Using database transactions to coordinate systems that can't participate (external APIs, message queues).
- **Transaction-per-method in repositories**: Every data access method wrapped in its own transaction, preventing composition.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-06 Application layer | SLP-11 Transaction management | DBC-11 Multi-context transactions |
| LAP-04 Dependency Rule | MMD-10 Cross-module data access | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Generate `DB::transaction()` in Use Case classes, not in Controllers or Repositories.
- Place external API calls and event dispatching after the transaction boundary.
- When generating repository methods, do not wrap them in individual transactions.

---

# Verification

- [ ] `DB::transaction()` is only used in Application layer (Use Cases/Services)
- [ ] No Controllers or Repositories manage their own transactions
- [ ] External API calls happen outside transaction boundaries
- [ ] Table access ordering within transactions is consistent
- [ ] Transaction duration is monitored in production
