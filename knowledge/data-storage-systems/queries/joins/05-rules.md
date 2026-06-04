# 2-13 Joins - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | queries |
| Knowledge Unit ID | 2-13 | |
| Knowledge Unit | 2-13 Joins |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Eager-Load Relationships In Loops
---
## Category
Performance
---
## Rule
Always use with() to eager load relationships when iterating model collections.
---
## Reason
Lazy loading inside loops creates N+1 query problem.
---
## Bad Example
Lazy loading in loops: $posts each trigger N+1 on comments
---
## Good Example
$users = User::with('posts')->get()  -- single query
---
## Exceptions
Single-item endpoints with minimal relationships.
---
## Consequences Of Violation
N+1 query performance degradation.

---

## 2. Use chunkById Over chunk For Production
---
## Category
Performance
---
## Rule
Always use chunkById for production batch processing, never chunk.
---
## Reason
chunk uses offset pagination and skips rows when records are deleted. chunkById uses a stable cursor.
---
## Bad Example
Model::chunk 100, function... -- skips rows on delete
---
## Good Example
Model::chunkById 100, function... -- stable cursor
---
## Exceptions
Append-only tables where records are never deleted.
---
## Consequences Of Violation
Skipped records in batch processing.

---

## 3. Disable Lazy Loading In Non-Production
---
## Category
Performance
---
## Rule
Always disable lazy loading in non-production environments using preventLazyLoading.
---
## Reason
Catches accidental N+1 immediately during development.
---
## Bad Example
Model::preventLazyLoading false  -- lazy loading allowed
---
## Good Example
Model::preventLazyLoading not $app->isProduction()
---
## Exceptions
Production environment.
---
## Consequences Of Violation
Undetected N+1 in production.

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

