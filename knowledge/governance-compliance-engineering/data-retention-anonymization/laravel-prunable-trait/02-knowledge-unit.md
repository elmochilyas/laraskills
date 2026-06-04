# Laravel Prunable Trait

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** data-retention-anonymization
- **Knowledge Unit:** Laravel Prunable Trait
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel's `Prunable` trait (introduced in Laravel 8) provides a native, framework-integrated mechanism for automatically pruning (deleting) old or expired Eloquent model records. For data retention compliance (GDPR, internal policies), it enables scheduled, efficient cleanup of data that has exceeded its retention window, without requiring custom scripting or third-party packages.

---

## Core Concepts

- **`Prunable` trait** on Eloquent models enables automated pruning via Artisan's `model:prune` command
- **`prunable()` method** defines the query scope that identifies records eligible for pruning
- **`pruning()` method** is a lifecycle hook that runs before each model is deleted
- **`massPrunable()` method** enables chunked deletion for high-volume pruning without loading all models
- **Scheduled pruning** via `php artisan model:prune` in the console kernel
- **Model discovery** automatically finds all models using the `Prunable` trait

---

## Mental Models

- **The Library Weeding:** Like removing old, never-borrowed books from the library shelves, pruning removes data that has exceeded its usefulness period.
- **The Composting System:** Organic waste (expired data) is systematically collected and composted (deleted), making room for new growth.
- **The Expiration Date Check:** Every record has an expiration date (retention period). The pruner is the automated stock clerk who removes expired products from shelves.

---

## Internal Mechanics

Models using the `Prunable` trait must define a `prunable()` method returning an Eloquent query builder. The `model:prune` Artisan command discovers all models with the trait, calls their `prunable()` scope, and deletes matching records. The `pruning()` method is called on each model before deletion, allowing cleanup of related data. For very large sets, `massPrunable()` can be used to prune via chunked queries. The trait does not run automatically — it must be triggered via the scheduler or manually.

---

## Patterns

**Age-Based Pruning Pattern:** Define `prunable()` to select records where `created_at` is older than retention period. Benefit: Simple, predictable, aligned with time-based retention policies. Tradeoff: Does not account for access recency — records may still be active.

**Status-Based Pruning Pattern:** Define `prunable()` to select records with a specific status (expired, cancelled, deleted). Benefit: Business-logic aware pruning. Tradeoff: Requires status management in application code.

**Hybrid Pruning Pattern:** Combine age and status criteria — prune records that are both expired-status AND older than a minimum age. Benefit: Most aligned with real-world retention policies. Tradeoff: More complex query logic.

---

## Architectural Decisions

Use `Prunable` for models with clear time-based retention policies. For models requiring multi-criteria retention logic, extend the `prunable()` scope with additional conditions. Use `massPrunable()` for models with millions of expiring records. Combine with soft deletes when records need a recovery window before permanent deletion. Schedule `model:prune` to run during off-peak hours daily. Add `pruning()` hooks to clean up related data (files, related records, external service data).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Native framework integration, no dependencies | Limited to simple retention criteria | Complex retention rules may need custom implementation |
| Automatic model discovery (no registration) | Models pruned independently — no cross-model coordination | Related data pruning must be handled in `pruning()` hooks |
| Chunked deletion for large datasets | Direct deletion (no soft delete window) | Combine with soft deletes if recovery capability is needed |
| Scheduled via standard Laravel scheduling | Pruning is irreversible | Test prune criteria thoroughly before production |

---

## Performance Considerations

Pruning runs on each model individually unless `massPrunable()` is used. Without mass pruning, thousands of individual DELETE queries impact performance. Use `massPrunable()` for any model with more than 1,000 eligible records. Index the columns used in `prunable()` queries (typically `created_at`, `expires_at`, status columns). Monitor prune execution time — slow pruning may indicate missing indexes or large transaction sizes. Schedule pruning during low-traffic periods.

---

## Production Considerations

Always dry-run `model:prune --pretend` before production to preview which records will be deleted. Monitor prune execution logs for errors. Implement a recovery window — combine with soft deletes so records can be restored if accidentally pruned. Test prune criteria with realistic data volumes before deployment. Alert on prune execution failures. Document pruning schedules and criteria for compliance auditors. Verify legal hold overrides — records on legal hold must be excluded from pruning queries.

---

## Common Mistakes

**Pruning without soft delete window** — once pruned, data is unrecoverable. Use soft deletes with pruning of soft-deleted records for a recovery window.

**Not excluding legal hold records** — pruning deletes records subject to litigation hold. Ensure `prunable()` excludes records with active legal holds.

**Pruning records that are referenced externally** — related data in other tables or external systems becomes orphaned. Handle cleanup in `pruning()` hooks.

---

## Failure Modes

- **Prune query missing index:** Full table scan on every prune execution. Add index on `prunable()` query columns.
- **`pruning()` hook failure:** Prune deletion succeeds but hook cleanup fails. Make hooks idempotent and handle errors gracefully.
- **Mass prune transaction timeouts:** Large `massPrunable()` batches lock tables. Use chunked mass pruning with small batch sizes.
- **Legal hold exclusion failure:** Record with active legal hold is pruned. Implement defense-in-depth — check legal hold at both query and hook levels.

---

## Ecosystem Usage

The `Prunable` trait is a first-party Laravel feature. It's commonly used in SaaS applications for: pruning expired sessions, cleaning up soft-deleted records, removing old audit logs, expiring temporary data (password resets, file uploads), and implementing GDPR-aligned data retention. The trait is documented in Laravel's Eloquent documentation and works with all supported databases.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Basics (model definitions, scopes)
- Laravel Scheduling (running model:prune)
- Soft Deletes (for recovery window)

### Related Topics
- Laravel Data Scrubber (anonymization before pruning)
- Retainable Contract Pattern (complex retention schedules)
- GDPR Data Retention Compliance

### Advanced Follow-up Topics
- Partition-Based Pruning for Large Tables
- Cascading Prune Across Related Models
- Retention Policy Audit and Compliance Verification

---

## Research Notes

The `Prunable` trait reflects Laravel's commitment to providing first-party solutions for common compliance requirements. Its simplicity (one trait, one method, one command) makes it accessible while its lifecycle hooks (`pruning()`) allow extension for complex cleanup workflows. The trait's design assumed models would be pruned independently — for cross-model retention coordination, the `pruning()` hook is the integration point but requires careful error handling. The trait does not handle the legal hold requirement natively — this must be implemented in the `prunable()` scope.
