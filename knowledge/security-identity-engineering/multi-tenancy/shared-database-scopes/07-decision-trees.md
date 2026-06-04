# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Shared Database + Global Eloquent Scopes
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Global Scope vs Manual Scoping | Tenant query scoping mechanism | security, maintainability |
| 2 | Tenant ID Strategy | Auto-increment vs UUID for tenant IDs | security, architectural |

---

# Architecture-Level Decision Trees

---

## Global Scope vs Manual Scoping

---

## Decision Context

Whether to use global Eloquent scopes for automatic tenant filtering or rely on manual `->where('tenant_id', ...)` calls.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

How many developers work on the codebase?
↓
Many (3+) → Global scopes required (human error risk increases with team size)
Few (1-2) → Global scopes still recommended (one developer can also forget)

How many tenant-scoped models exist?
↓
Many (10+) → Global scopes essential (too many models for manual where() discipline)
Few (2-3) → Global scopes still recommended (one missed scope = data leak)

Is there a trait that can be applied to all tenant models?
↓
YES → Global scope via trait (apply once to all models)
NO → Create the trait (it's a one-time effort for permanent safety)

Are there raw DB queries (`DB::table()`) that query tenant data?
↓
YES → Must add `->where('tenant_id', ...)` manually to each (audit all raw queries)
NO → Global scopes cover all Eloquent queries

Are there legitimate cases to bypass tenant scoping (admin tools)?
↓
YES → `withoutGlobalScopes()` with explicit documentation and audit
NO → Global scope enforcement is clean

What is the cost of a data leak?
↓
High → Global scopes (defense in depth: scope + middleware validation)
Low → Manual scoping may be acceptable (still not recommended)

---

## Rationale

Global scopes are the only reliable way to enforce tenant isolation at the query level. Manual `->where('tenant_id', ...)` is fragile — a single developer forgetting it on one query leaks all tenants' data. Global scopes applied via a reusable trait (`BelongsToTenant`) provide automatic, consistent enforcement. The cost of implementing the trait is minimal compared to the risk of a data leak.

---

## Recommended Default

**Default:** Global scope via `BelongsToTenant` trait on every tenant-scoped model; never rely on manual `where('tenant_id')` calls
**Reason:** Global scopes provide automatic, consistent tenant isolation that cannot be accidentally omitted. Manual scoping is inevitably forgotten in some queries — the cost of a single missed scope (data leak) is catastrophic.

---

## Risks Of Wrong Choice

- Manual scoping: inevitable missed `where('tenant_id')` in some query = data leak
- Global scope without auto-fill on create: tenant_id not set on new records
- `withoutGlobalScopes()` without audit: bypasses tenant isolation invisibly
- No scope on eager-loaded relationships: related data from wrong tenant

---

## Related Rules

- Add a `tenant_id` Column to Every Tenant-Scoped Table (05-rules.md)
- Apply a Global Scope to Automatically Filter by `tenant_id` (05-rules.md)
- Set `tenant_id` Automatically on Model Creation (05-rules.md)

---

## Related Skills

- Implement Shared-Database Multi-Tenancy with Global Scopes (06-skills.md)

---

## Tenant ID Strategy

---

## Decision Context

Whether to use auto-increment integers or UUIDs for tenant primary keys.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is tenant enumeration a security concern?
↓
YES → UUIDs (auto-increment IDs allow attackers to enumerate tenants)
NO → Auto-increment acceptable (but UUIDs still preferred)

Do URLs or API responses expose tenant IDs?
↓
YES → UUIDs (auto-increment IDs in URLs are guessable)
NO → Auto-increment acceptable in internal contexts

How are tenants identified in the application?
↓
By domain/subdomain → Tenant ID is internal, auto-increment may be acceptable
By ID in URL → UUIDs strongly recommended (prevents ID guessing)

What is the database's primary key convention?
↓
UUIDs for all models → Use UUIDs for tenant ID (consistent)
Auto-increment for all models → Auto-increment for tenant ID acceptable

How many tenants does the application expect?
↓
Few (< 1000) → Auto-increment is practically fine (but UUIDs are safer)
Many (1000+) → Auto-increment fine for scale, but UUIDs preferred for security

---

## Rationale

UUIDs prevent tenant enumeration (attacker cannot guess tenant IDs) and eliminate ID collision risks if merging databases. Auto-increment IDs are simpler and more readable but expose data cardinality. For multi-tenant applications, UUIDs are strongly recommended because tenant IDs may appear in URLs, API responses, or logs — auto-increment IDs make tenants enumerable.

---

## Recommended Default

**Default:** UUIDs for tenant IDs in all multi-tenant applications; auto-increment only when not exposed externally and enumeration is not a concern
**Reason:** UUIDs prevent tenant enumeration (an attacker cannot guess `tenant_5` exists) and eliminate ID collision issues. The storage overhead (36 chars vs 4 bytes for integer) is negligible for the tenant table which has few rows. UUIDs are the industry standard for multi-tenant primary keys.

---

## Risks Of Wrong Choice

- Auto-increment tenant IDs: attacker can enumerate tenants (`/tenant/1`, `/tenant/2`, etc.)
- Auto-increment in shared DB: unique constraints per tenant must use composite keys
- UUIDs without index: sequential lookups are slower on UUID primary keys (use UUID v7 for time-ordered)
- UUIDs everywhere: storage overhead on large tables (consider tenant_id as FK integer with UUID public ID)

---

## Related Rules

- Create a Composite Unique Key Including `tenant_id` (05-rules.md)
- Test Tenant Data Isolation in Feature Tests (05-rules.md)

---

## Related Skills

- Implement Shared-Database Multi-Tenancy with Global Scopes (06-skills.md)
