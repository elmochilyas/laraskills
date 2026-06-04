# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-18 Last Mile Migration Validation
**Generated:** 2026-06-03

---

# Decision Inventory

* Automated vs Manual Pre-Deployment Validation
* Pre-Deployment Checks vs Real-Time Monitoring During Migration
* Scheduled Maintenance Window vs On-Demand Migration

---

# Architecture-Level Decision Trees

---

## Automated vs Manual Pre-Deployment Validation

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer preparing for a production migration must decide whether to use an automated validation script or a manual checklist.

---

## Decision Criteria

* performance considerations: validation run time
* architectural considerations: deployment pipeline integration
* security considerations: credential management for automation
* maintainability considerations: script maintenance, exception handling

---

## Decision Tree

Is this a standard, low-risk migration?
↓
YES → Use automated validation (php artisan migrate:check) — gates deployment
NO → Is this a high-risk or destructive migration?
    YES → Use automated validation + manual checklist walkthrough
    NO → Use automated validation

---

## Rationale

Automated validation catches the most common issues (disk space, blocking queries, backup recency) consistently every time. For standard migrations, this is sufficient. For high-risk migrations (destructive operations, schema renames, type changes), the automated checks should be supplemented with a manual checklist walkthrough that considers context-specific risks that automation cannot assess.

---

## Recommended Default

**Default:** Automated validation for all migrations, manual supplement for high-risk
**Reason:** Automation ensures consistency and prevents the most common failures. Manual review adds context-specific safety for high-risk operations. Both together provide comprehensive validation without slowing down standard migrations.

---

## Risks Of Wrong Choice

Automated-only validation for a destructive migration misses context-specific risks (e.g., an application deployment that still references the old column). Manual-only validation is skipped under deployment pressure.

---

## Related Rules

Run pre-deployment validation checks. Test migration on staging before production.

---

## Related Skills

Run Pre-Deployment Migration Validation Checklist

---

## Pre-Deployment Checks vs Real-Time Monitoring During Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a migration must decide how to invest monitoring effort: pre-checks before starting or real-time monitoring during execution.

---

## Decision Criteria

* performance considerations: preparedness vs reactive response
* architectural considerations: alerting infrastructure, runbook availability
* security considerations: detection vs prevention
* maintainability considerations: monitoring configuration effort

---

## Decision Tree

Can you predict the failure modes of this migration?
↓
YES → Invest in both pre-checks (prevention) and real-time monitoring (detection)
NO → Invest more in real-time monitoring (unknown failure modes)

---

## Rationale

Pre-checks prevent known failure modes: insufficient disk, blocking queries, no recent backup. Real-time monitoring catches unexpected issues during execution: replication lag spikes, error rate increases, lock contention. Both are necessary. Pre-checks prevent the most common and predictable failures. Real-time monitoring handles the unexpected. For novel or complex migrations, invest more in monitoring because you can't predict all failure modes upfront.

---

## Recommended Default

**Default:** Both pre-checks and real-time monitoring
**Reason:** Pre-checks are cheap and prevent common issues. Real-time monitoring catches the rest. Skipping either leaves a gap. Pre-checks should gate the deployment; real-time monitoring should trigger automated rollback.

---

## Risks Of Wrong Choice

Pre-checks only miss runtime issues like unexpected replication lag. Real-time monitoring only means the migration starts even when it's doomed to fail, wasting time and risking data corruption.

---

## Related Rules

Run pre-deployment validation checks. Verify disk space before DDL operations.

---

## Related Skills

Run Pre-Deployment Migration Validation Checklist

---

## Scheduled Maintenance Window vs On-Demand Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer must decide whether to require a scheduled maintenance window for a migration or allow it to run on-demand at any time.

---

## Decision Criteria

* performance considerations: traffic patterns, peak load times
* architectural considerations: zero-downtime capability, tooling availability
* security considerations: change management compliance
* maintainability considerations: deployment flexibility, team schedules

---

## Decision Tree

Does the migration use zero-downtime techniques (INSTANT, INPLACE LOCK=NONE, shadow tool)?
↓
YES → On-demand migration is safe (no user-facing impact expected)
NO → Schedule during maintenance window (expect temporary disruption)

---

## Rationale

Zero-downtime migrations (using INSTANT, INPLACE with LOCK=NONE, or shadow table tools) should not impact production traffic and can run on-demand. Migrations requiring COPY or EXCLUSIVE locks will block writes and should be scheduled during maintenance windows. Even for zero-downtime migrations, consider scheduling during low-traffic periods as a precaution against unexpected behavior.

---

## Recommended Default

**Default:** Zero-downtime migrations on-demand, locking migrations in maintenance windows
**Reason:** The migration approach determines the acceptable timing. If the approach guarantees zero user impact, there's no reason to restrict to a window. If it might impact users, restrict it to a planned window with stakeholder communication.

---

## Risks Of Wrong Choice

Running a locking migration outside a maintenance window causes unexpected application downtime. Requiring a maintenance window for every INSTANT migration adds unnecessary scheduling overhead and delays.

---

## Related Rules

Run pre-deployment validation checks. Verify disk space before DDL operations.

---

## Related Skills

Run Pre-Deployment Migration Validation Checklist
