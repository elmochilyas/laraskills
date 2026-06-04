# Williamug Audited

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** audit-trails-activity-logging
- **Knowledge Unit:** Williamug Audited
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Williamug Audited is a Laravel audit package that provides comprehensive audit logging with support for conditional auditing, attribute-level change tracking, and flexible user attribution. It enables fine-grained control over what gets audited and when, making it suitable for applications with complex compliance requirements that vary by model, user role, or data sensitivity level.

---

## Core Concepts

- **Conditional auditing** allows enabling/disabling audit logging per model, per user, or per operation based on runtime conditions
- **Attribute-level tracking** captures individual field changes with before/after values
- **Flexible user context** supports multiple authentication guards and anonymous system users
- **Audit scoping** categorizes audit entries by business domain for organized querying
- **Configurable retention** supports per-scope retention policies
- **Read auditing** can optionally track read access to sensitive data for privacy compliance

---

## Mental Models

- **The Selective Recorder:** Unlike indiscriminate logging, this package only records when and what it's told to, based on configurable sensitivity rules.
- **The Security Guard:** It watches specific doors (models) and only logs entries for certain badge levels (user roles) during certain hours (conditions).
- **The Librarian:** Every book (model) check-in/check-out is recorded, but only rare books (sensitive data) are tracked for in-library reading (read access).

---

## Internal Mechanics

The `Audited` trait uses Eloquent's model events for change capture. Conditional auditing is implemented via callback configuration — a closure receives the model, user, and operation, and returns a boolean. Attribute-level changes are computed by diffing the model's original and current attributes. User resolution chains through multiple guards with fallback. Audit scopes are stored as a column for efficient filtering. Read auditing hooks into model accessor events to log when sensitive attributes are read.

---

## Patterns

**Sensitivity-Based Auditing Pattern:** Configure different audit levels based on data classification (public, internal, confidential, restricted). Benefit: Proportional audit effort matching compliance risk. Tradeoff: Requires data classification metadata on models.

**Role-Selective Auditing Pattern:** Audit only actions performed by non-admin users, trusting administrators' actions are appropriate. Benefit: Reduces audit noise from privileged operations. Tradeoff: Administrators become an audit blind spot for insider threat scenarios.

**Read Audit Pattern:** Track read access to specified sensitive attributes (PII, financial data). Benefit: Privacy compliance (GDPR Article 15, right of access verification). Tradeoff: Significant storage and performance cost for read-heavy data.

---

## Architectural Decisions

Use conditional auditing when different models or data categories have different compliance requirements. This avoids logging everything at the same level. Read auditing should be used sparingly — only for the most sensitive data elements — as it generates significantly more log volume than write auditing. Per-scope retention policies enable keeping sensitive audit data longer while pruning low-sensitivity audit entries more aggressively.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Conditional auditing reduces log volume | Conditional logic complexity at audit time | More difficult audit configuration review |
| Attribute-level changes enable precise reporting | Diff computation per model change | Additional CPU overhead, especially for models with many attributes |
| Read auditing for privacy compliance | ~10x log volume increase for read-tracked models | Performance impact on read-heavy APIs |
| Per-scope retention (flexible) | Multiple retention schedules to manage | More complex pruning configuration |

---

## Performance Considerations

Conditional auditing callbacks execute on every model event — keep them lightweight. Attribute diffing adds overhead proportional to number of model attributes. Read auditing is the most expensive feature — enable only for specific sensitive columns, not entire models. Index `audit_scope`, `auditable_type`, `auditable_id`, `user_id`, and `created_at` for query efficiency. Use queue for audit writes to minimize request latency impact.

---

## Production Considerations

Audit the audit configuration — log when conditional audit rules change to detect configuration drift. Test conditional audit rules during deployment verification to ensure expected behavior. Monitor read audit volume separately from write audit metrics. Create compliance dashboards for each audit scope. Verify per-scope retention policies are enforced correctly through regular audits of pruning job behavior.

---

## Common Mistakes

**Over-engineering conditional rules** — complex audit conditionals become unmaintainable. Start with broad rules and refine based on actual compliance needs.

**Enabling read auditing on too many models** — storage and performance costs escalate quickly. Limit read auditing to regulated data elements only.

**Forgetting to test conditional rules during deployment** — silent rule failures cause under-auditing. Include conditional audit tests in CI pipeline.

---

## Failure Modes

- **Conditional callback exception:** An error in the audit condition causes all auditing for that model to fail silently. Wrap callbacks in try-catch with fallback to audit.
- **Read audit storage explosion:** Enable on a high-read model (e.g., product catalog) generating millions of entries daily. Monitor and alert on read audit volume.
- **Scope misclassification:** Audits written to wrong scope due to configuration error. Include scope validation in audit configuration review.

---

## Ecosystem Usage

Williamug Audited serves applications with tiered compliance requirements where not all data is equally sensitive. It is well-suited for healthcare applications that must audit access to Protected Health Information (PHI) differently from operational data. The read auditing feature aligns with GDPR requirements for tracking access to personal data. Conditional auditing enables fine-grained compliance without the storage cost of blanket audit logging.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM Model Events
- Data Classification Concepts
- Laravel Authentication Guards

### Related Topics
- Data Classification Sovereignty (Three-Tier Classification)
- Spatie Activitylog v5 (alternative for uniform auditing)
- GDPR Right of Access implementation

### Advanced Follow-up Topics
- Programmatic Audit Configuration Management
- Read Audit Forensic Analysis
- Conditional Audit Rule Patterns for Multi-Tenant Systems

---

## Research Notes

The conditional auditing feature is relatively unique among Laravel audit packages and addresses the real-world reality that not all data in an application carries the same compliance weight. Read auditing, while expensive, is increasingly required by privacy regulations (GDPR, CCPA) that grant individuals the right to know who accessed their data. Williamug Audited's design reflects a mature understanding of tiered compliance strategies where audit effort is proportional to data sensitivity.
