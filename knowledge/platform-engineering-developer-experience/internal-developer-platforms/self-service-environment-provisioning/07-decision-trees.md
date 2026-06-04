# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Self-Service Environment Provisioning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we implement self-service provisioning? | Setup time, scale, parity needs | Yes — for teams spending > 30 min on setup |
| 2 | Local vs remote provisioning? | Use case, team size, infra budget | Local Docker for dev; remote for staging |
| 3 | Fresh seeds vs database snapshots? | Consistency needs, speed requirements | Fresh seeds for consistency |
| 4 | TTL policy for environment cleanup? | Environment type, cost, security risk | 48h feature branches, 30d staging |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Implement Self-Service Provisioning?

---

## Decision Context

Self-service provisioning enables developers to create environments on demand without platform team intervention. The investment includes automation scripts, CI integration, and ongoing maintenance. The decision depends on current setup time and team scale.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

How long do developers spend setting up local environments?
↓
< 30 minutes → Self-service provisioning not justified
30+ minutes → ↓
How many developers?
↓
< 5 → Ad-hoc environments without automation are acceptable
5+ → ↓
Do applications require complex service topologies (DB + cache + queue + search)?
↓
NO (simple: SQLite, no queue) → Sail is sufficient without additional automation
YES → ↓
Is there capacity to implement AND maintain provisioning automation?
↓
NO → Do not implement; automate when resources available
YES → **Implement self-service provisioning** — start with local dev, add remote later

---

## Rationale

Provisioning automation must be maintained, not just built. The 30-minute setup time threshold identifies real friction. Complex service topologies (multiple databases, queues, search engines) benefit most from automation because manual setup is error-prone and time-consuming.

---

## Recommended Default

**Default:** Implement for teams of 5+ with > 30 min setup time
**Reason:** Automation ROI is clear at this threshold; below it, manual setup is acceptable

---

## Risks Of Wrong Choice

- **Automating too early:** Unstable processes automated prematurely; automation breaks frequently
- **No automation at scale (20+ devs):** Lost developer hours; inconsistent environments; parity bugs

---

## Related Rules

- PROV-RULE-023: Provisioning justified when developers spend > 30 min on setup
- PROV-RULE-024: < 5 developers — ad-hoc is acceptable

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel
- Set Up Preview Environments for Laravel PR Workflows

---

## Decision 2: Local vs Remote Provisioning?

---

## Decision Context

Provisioning can target local Docker environments (developers' machines) or remote infrastructure (Forge servers, Kubernetes). The choice depends on the environment purpose, team distribution, and infrastructure budget.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

What is the environment type?
↓
**Development (daily coding)**
↓
Local Docker (Sail) — fastest feedback loop, no network dependency
↕
**Staging (integration testing)**
↓
Remote Forge/VPS — parity with production, team access
↕
**Preview/PR (review testing)**
↓
Remote K8s or Forge — ephemeral, URL accessible to reviewers
↕
**Production**
↓
Remote Forge/VPS/K8s — not self-service; managed by platform team

Additional considerations:
- Remote environments require infrastructure budget
- Local environments require Docker on developer machines
- Hybrid: local dev + remote staging is the most common pattern

---

## Rationale

Different environment types have different requirements. Development needs speed and offline capability (local Docker). Staging needs production parity and team access (remote Forge). Preview environments need URLs for reviewers (remote, ephemeral). Match the provisioning target to the environment's purpose.

---

## Recommended Default

**Default:** Local Docker (Sail) for development + Remote Forge for staging
**Reason:** Most common and cost-effective pattern; covers 80% of provisioning needs

---

## Risks Of Wrong Choice

- **Remote-only for development:** Slow feedback loop; requires internet; expensive for daily use
- **Local-only at scale (no staging):** Parity bugs caught late; no environment for integration testing

---

## Related Rules

- PROV-RULE-006: Provisioning target selection
- PROV-RULE-004: Parity over speed

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel
- Configure Laravel Sail for Local Development
- Set Up Preview Environments for Laravel PR Workflows

---

## Decision 3: Fresh Seeds vs Database Snapshots?

---

## Decision Context

When provisioning environments, the database can be populated with fresh seed data (run seeders) or restored from a snapshot (dump of a reference database). The choice affects consistency, speed, and data freshness.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

What is the environment type?
↓
**CI (testing)**
↓
**Fresh seeds (schema only)** — fastest, deterministic, no sensitive data
↕
**Development**
↓
**Fresh seeds with dummy data** — consistent starting state, no PII concerns
↕
**Staging**
↓
↓
Is production data subset available and anonymized?
↓
YES → **Anonymized production snapshot** — realistic data for testing
NO → **Fresh seeds** — avoid PII risk; generate realistic volume manually
↕
**Preview (PR review)**
↓
**Fresh seeds with PR-specific scenarios** — test specific feature behavior

---

## Rationale

Different environments have different data needs. CI environments need speed and determinism (schema only). Development environments benefit from realistic dummy data. Staging needs production-like data volume. The key constraint is PII — never use production data without proper anonymization.

---

## Recommended Default

**Default:** Fresh seeds for consistency and data freshness
**Reason:** Snapshots become stale; schema changes require migration; fresh seeds are always consistent with current code

---

## Risks Of Wrong Choice

- **Stale snapshots:** Database schema incompatible with current code; migrations fail on restore
- **Production data without anonymization:** PII exposure risk; compliance violation

---

## Related Rules

- PROV-RULE-009: Data seeding profiles
- PROV-RULE-028: Avoid the Stale Snapshot

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel

---

## Decision 4: TTL Policy for Environment Cleanup?

---

## Decision Context

Environment TTL (time-to-live) policies automatically destroy environments after a configured duration. The policy prevents resource exhaustion and security surface area growth. Different environment types need different TTLs.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

What is the environment type?
↓
**Feature branch / PR preview**
↓
TTL: 48 hours max — feature branches should be short-lived
↓
Auto-destroy on PR merge/close (whichever comes first)
↕
**Staging / integration**
↓
TTL: 30 days max — long-lived but not permanent
↓
Require renewal for longer life
↕
**Development (local)**
↓
No TTL — developer machine; not centrally managed
↕
**Production**
↓
No TTL — permanent environment; managed separately

Enforcement:
- Hard TTL (destroy regardless of activity) vs soft TTL (destroy if idle + TTL exceeded)
- Hard TTL for cost control; soft TTL for developer convenience
- Notify developers 24h before hard TTL expiration

---

## Rationale

Without TTL policies, environments accumulate as orphaned resources that cost money and increase attack surface. The 48-hour feature branch TTL aligns with typical PR review cycles. The 30-day staging TTL accommodates longer testing cycles while preventing permanent staging environments that diverge from production.

---

## Recommended Default

**Default:** 48h TTL for feature branches, 30d TTL for staging
**Reason:** Balances developer convenience with resource hygiene; aligns with typical development cycles

---

## Risks Of Wrong Choice

- **No TTL:** Orphaned environments accumulate; costs grow; security surface area expands
- **Too aggressive TTL:** Environments destroyed mid-review; developer frustration

---

## Related Rules

- PROV-RULE-003: Implement destroy with create
- PROV-RULE-017: TTL-based auto-cleanup
- PROV-RULE-002: Cattle, not pets

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel
- Set Up Preview Environments for Laravel PR Workflows

