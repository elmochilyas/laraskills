# Retainable Contract Pattern

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** data-retention-anonymization
- **Knowledge Unit:** Retainable Contract Pattern
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The Retainable Contract Pattern is an architectural design pattern that defines a standardized interface for data retention policies across all models in a Laravel application. By implementing a `Retainable` contract, each model declares its retention rules (duration, criteria, action), enabling a unified engine to enforce compliance consistently while allowing model-specific retention logic.

---

## Core Concepts

- **`Retainable` contract/interface** that each model implements to declare its retention behavior
- **Retention rules** define duration, triggering criteria, and action (anonymize, archive, delete)
- **Retention engine** is a central service that discovers retainable models and enforces their rules
- **Policy composition** allows combining multiple retention rules for complex scenarios
- **Legal hold** overrides retention rules for records subject to litigation or investigation
- **Audit logging** records all retention enforcement actions for compliance evidence

---

## Mental Models

- **The Standard Rental Contract:** Every model signs a standard contract (interface) promising to follow specific retention rules. A compliance officer (engine) audits all signatories.
- **The Library Checkout System:** Each book has a due date (retention period). Some books (legal hold) are frozen and cannot be returned. The librarian (engine) sends reminders and processes returns.
- **The Traffic Light System:** Green (keep), Yellow (review), Red (remove). Each model has its own traffic light rules, and a central system enforces the lights.

---

## Internal Mechanics

The `Retainable` contract defines methods: `retentionDuration()`, `retentionCriteria()`, `retentionAction()`, and `isRetentionExempted()`. Each model implementing the contract provides its implementation. A central `RetentionEngine` service discovers all registered retainable models, iterates through them, queries records matching their criteria, and applies the configured action (anonymize via scrubber, archive to cold storage, or delete). Legal hold is checked before any action — exempted records are skipped. The engine runs as a scheduled job, processing models in configurable order and batch sizes.

---

## Patterns

**Single Model Retention Pattern:** Each model implements `Retainable` with its own simple retention rule. Benefit: Clear, testable, self-documenting. Tradeoff: Repetitive if many models have identical rules.

**Policy Registry Pattern:** Define retention policies as separate classes, models reference policies by name. Benefit: Reuse common policies across models. Tradeoff: Indirect coupling between models and policies.

**Composition Pattern:** Combine multiple retention rules — prune after X days OR if status is expired, whichever is later. Benefit: Handles complex regulatory requirements. Tradeoff: Rule evaluation order matters and can be confusing.

---

## Architectural Decisions

Use the Retainable Contract Pattern when retention requirements vary significantly across models or are expected to change over time. The interface provides a clear contract for developers and a single enforcement point for compliance. Choose policy composition for models that fall under multiple retention frameworks (e.g., GDPR + internal policy). Implement legal hold as a separate concern — checked by the engine before any retention action. Register retainable models explicitly in the provider for engine discovery.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear retention contract per model | Every model needs interface implementation | Initial setup overhead but long-term maintainability |
| Centralized enforcement engine | Engine must know about all models | Model registration in service provider |
| Policy composition for complex rules | Rule evaluation complexity | Testing matrix for combined rules |
| Legal hold integration point | Legal hold check on every retention action | Additional query per model processed |

---

## Performance Considerations

The engine iterates through all registered models — optimize by skipping models with no eligible records. Cache model retention configurations. Batch retention actions within each model's processing. Legal hold checks add query overhead — ensure `is_retention_exempted` column is indexed. Archive operations are I/O intensive — schedule during off-peak hours. Queue retention actions for models with large volumes of records.

---

## Production Considerations

Always run the engine in dry-run mode initially to preview actions. Implement a kill switch to halt processing mid-cycle. Monitor retention engine execution logs for errors. Alert on engine failures — missed retention enforcement is a compliance gap. Establish a review process for retention policy changes. Test engine with copy of production data before deployment. Maintain a manual override for emergency retention changes. Document retention policies for each model for auditors.

---

## Common Mistakes

**Implementing retention without legal hold awareness** — legal hold must always override retention actions. Always check exemption status.

**Creating too many model-specific policies** — leads to maintenance burden when policies change. Reuse policies where possible, customize only when necessary.

**Not testing retention actions with realistic data volumes** — anonymizing or archiving millions of records has performance characteristics that differ from small-scale testing.

---

## Failure Modes

- **Engine crash mid-processing:** Some models processed, others not. Implement idempotent processing with checkpoint tracking.
- **Legal hold table corruption:** Exemption status is lost. Implement redundant legal hold check (database + external register).
- **Retention action failure:** Archive/delete operation fails for subset of records. Retry with exponential backoff, then alert.
- **Policy configuration error:** Retention duration zero causes immediate deletion. Validate policies before registration.

---

## Ecosystem Usage

The Retainable Contract Pattern is an architectural pattern rather than a specific package, but it builds on Laravel's contract-first design philosophy. It integrates with Laravel's scheduler (engine execution), Queue (async retention actions), Filesystem (archive operations), and Policy system (legal hold authorization). Models implementing the contract are registered in a service provider and discovered by the retention engine. The pattern is commonly used in enterprise Laravel applications with complex, multi-regulation retention requirements.

---

## Related Knowledge Units

### Prerequisites
- PHP Interfaces and Contracts
- Laravel Service Provider Registration
- Data Retention Concepts

### Related Topics
- Laravel Prunable Trait (native alternative for simple retention)
- Laravel Data Scrubber (anonymization as retention action)
- GDPR Compliance (retention context)

### Advanced Follow-up Topics
- Multi-Jurisdiction Retention Policy Management
- Automated Retention Policy Testing and Validation
- Data Retention Scheduling for Distributed Systems

---

## Research Notes

The Retainable Contract Pattern addresses a gap in Laravel's native retention tooling. While `Prunable` provides simple time-based deletion, real-world retention scenarios require per-model customization, multiple action types (anonymize, archive, delete), and legal hold awareness. The contract pattern creates a clean abstraction that can be implemented incrementally — start with a few critical models and expand. The pattern's key insight is that retention is a cross-cutting concern best managed centrally, not duplicated across models. This pattern is documented in enterprise Laravel architecture references and is recommended for SOC 2 and GDPR compliance programs.
