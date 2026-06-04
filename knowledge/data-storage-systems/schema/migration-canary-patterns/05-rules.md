# 11-15 Migration Canary Patterns - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | schema |
| Knowledge Unit ID | 11-15 | |
| Knowledge Unit | 11-15 Migration Canary Patterns |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Test Migrations Before Production
---
## Category
Testing
---
## Rule
Always test ALL migrations on a production-scale staging database before deploying.
---
## Reason
Migration behavior differs dramatically between small dev DB and production-scale data. A migration that takes 1 second in dev may take 30 minutes in production.
---
## Bad Example
Testing migrations only on an empty local database.
---
## Good Example
Replaying migrations on a production-size clone and measuring execution time.
---
## Exceptions
Trivial metadata-only migrations (add column, no default).
---
## Consequences Of Violation
Production downtime from unexpectedly slow or locking migrations.

---

## 2. Never Use Eloquent Models Inside Migrations
---
## Category
Maintainability
---
## Rule
Never reference Eloquent models or classes in migration files.
---
## Reason
Models change over time. A migration referencing a model will break when the model is refactored or deleted.
---
## Bad Example
User::where('status', 'active')->update(['type' => 'customer']); // in a migration
---
## Good Example
DB::table('users')->where('status', 'active')->update(['type' => 'customer']);
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Broken fresh migrations, failed CI/CD pipelines.

---

## 3. Separate Schema Changes From Data Changes
---
## Category
Code Organization
---
## Rule
Never mix schema DDL and data DML in the same migration file.
---
## Reason
Coupling schema and data changes in one migration prevents partial rollback and complicates debugging.
---
## Bad Example
Schema::create('roles', ...); DB::table('roles')->insert([...]); // in same file
---
## Good Example
// Migration 1: create_roles_table. Migration 2: seed_roles_data.
---
## Exceptions
Small lookup tables (<20 rows) that define the schema.
---
## Consequences Of Violation
Complex rollbacks, unrecoverable migration states.

---

## 4. Review And Apply Core Concepts
---
## Category
Design
---
## Rule
Always understand and apply the core concepts documented in this knowledge unit before making implementation decisions.
---
## Reason
Core concepts define the foundational principles that correct implementation depends on.
---
## Bad Example
Implementing without understanding core concepts.
---
## Good Example
Reviewing core concepts before implementation.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Implementation errors, unexpected behavior.

---

## 5. Consider Architecture Guidelines
---
## Category
Architecture
---
## Rule
Always review the architecture guidelines section when designing systems that involve this knowledge area.
---
## Reason
Architecture guidelines provide decision frameworks for selecting between approaches.
---
## Bad Example
Choosing an approach without comparing alternatives.
---
## Good Example
Using the architecture decision table to make informed choices.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Suboptimal architectural decisions.

---

