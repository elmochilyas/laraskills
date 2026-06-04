# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Neon Database Branching
**Generated:** 2026-06-03

---

# Decision Inventory

1. Database Branching Workflow
2. Neon Branch Cost Control

---

# Architecture-Level Decision Trees

---

## Decision Name: Database Branching Workflow

---

## Decision Context

Design branching workflow for development teams using Neon.

---

## Decision Criteria

cost, productivity

---

## Decision Tree

Team size?

1-3 devs -> 1-3 branches, manual
4-10 devs -> Automated per developer
> 10 -> CI/CD integrated lifecycle

Branch source?
Production (copy-on-write) -> Realistic, free until modified
Synthetic -> Consistent, no PII concerns

Lifecycle:
Create on PR open
Auto-pause after 5 min idle
Auto-delete after 7-14 day TTL or PR merge

CI/CD integration?
Create at start, delete at end
Cost: ~.002 per run (5 min compute)

---

## Rationale

Neon's copy-on-write branching provides instant isolated DBs at near-zero cost. Each developer gets their own DB without shared staging conflicts.

---

## Recommended Default

**Default:** Branch from production; auto-pause 5 min; 7-day TTL; CI/CD create/delete per run

---

## Risks Of Wrong Choice

No TTL = orphaned branches accumulate storage costs. No auto-pause = compute 24/7.

---

## Related Rules

Rule: Follow standardized Neon Database Branching practices

---

## Related Skills

Analyze and Optimize Neon Database Branching

---

---

## Decision Name: Neon Branch Cost Control

---

## Decision Context

Configure compute limits and lifecycle policies for cost control.

---

## Decision Criteria

cost, operational_overhead

---

## Decision Tree

Branch purpose?

Developer -> 1 CU, 7-day TTL, 5-min auto-pause
CI/CD -> 2 CU, create/delete per run
PR preview -> 1-2 CU, delete on merge/close
Long-term testing -> 2-4 CU, 30-day TTL

Compute monitoring:
Free tier: 100 compute-hours/month
4 devs x 2hr/day x 30 = 240 hours (exceeds free)
Set billing alert at 80%

Storage delta monitoring:
Track per branch monthly
Investigate > 1GB delta branches

---

## Rationale

Neon charges .106/CU-hour. Developer branches with auto-pause cost ~.36/month each. Without auto-pause: /month running 24/7.

---

## Recommended Default

**Default:** Dev: 1 CU, 5-min auto-pause, 7-day TTL; CI/CD: create/delete per run; monitor monthly credits

---

## Risks Of Wrong Choice

No auto-pause = /month per dev branch running 24/7 when used 8 hours/day.

---

## Related Rules

Rule: Follow standardized Neon Database Branching practices

---

## Related Skills

Analyze and Optimize Neon Database Branching

---

