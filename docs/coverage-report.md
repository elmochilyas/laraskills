# Knowledge Unit Coverage Report

**Date:** 2026-06-04
**Total KUs:** 2,328
**Expected Artifacts:** 13,968 (2,328 × 6)
**Actual Artifacts:** 13,795
**Overall Coverage:** 98.76%

---

## Coverage by Domain

| Domain | KUs | Expected | Actual | Missing | Coverage |
|--------|-----|----------|--------|---------|----------|
| ai-intelligence-systems | 117 | 702 | 702 | 0 | **100%** |
| api-crud-system-engineering | 246 | 1,476 | 1,431 | 45 | **96.95%** |
| api-integration-engineering | 82 | 492 | 492 | 0 | **100%** |
| application-architecture-patterns | 107 | 642 | 642 | 0 | **100%** |
| async-distributed-systems | 95 | 570 | 570 | 0 | **100%** |
| backend-architecture-design | 84 | 504 | 504 | 0 | **100%** |
| cost-resource-optimization | 110 | 660 | 660 | 0 | **100%** |
| data-engineering-analytics | 44 | 264 | 264 | 0 | **100%** |
| data-storage-systems | 289 | 1,734 | 1,692 | 42 | **97.58%** |
| devops-infrastructure | 48 | 288 | 282 | 6 | **97.92%** |
| governance-compliance-engineering | 40 | 240 | 240 | 0 | **100%** |
| laravel-core-application-engineering | 159 | 954 | 954 | 0 | **100%** |
| laravel-eloquent-domain-modeling | 171 | 1,026 | 946 | 80 | **92.20%** |
| laravel-execution-lifecycle | 115 | 690 | 690 | 0 | **100%** |
| observability-production-intelligence | 34 | 204 | 204 | 0 | **100%** |
| performance-runtime-engineering | 161 | 966 | 966 | 0 | **100%** |
| platform-engineering-developer-experience | 107 | 642 | 642 | 0 | **100%** |
| real-time-systems | 39 | 234 | 234 | 0 | **100%** |
| search-retrieval-systems | 140 | 840 | 840 | 0 | **100%** |
| security-identity-engineering | 61 | 366 | 366 | 0 | **100%** |
| testing-reliability-engineering | 79 | 474 | 474 | 0 | **100%** |

---

## Missing Artifacts by File Type

| Artifact | Total Expected | Missing | % Complete |
|----------|---------------|---------|------------|
| 04-standardized-knowledge.md | 2,328 | 44 | 98.11% |
| 05-rules.md | 2,328 | 44 | 98.11% |
| 06-skills.md | 2,328 | 10 | 99.57% |
| 07-decision-trees.md | 2,328 | 1 | 99.96% |
| 08-anti-patterns.md | 2,328 | 30 | 98.71% |
| 09-checklists.md | 2,328 | 44 | 98.11% |

---

## Detailed Missing Files

### Critical: laravel-eloquent-domain-modeling (80 missing)

**Subdomain: attributes-and-casting** (8 KUs × 4 files each = 32 missing)
Missing: 04-standardized-knowledge.md, 05-rules.md, 08-anti-patterns.md, 09-checklists.md
- `date-casting`, `enum-casting`, `immutable-casting`, `json-casting`
- `legacy-accessor-mutators`, `migration-to-attribute-make`
- `primitive-casting`, `typed-attribute-accessors-with-dto`

**Subdomain: domain-modeling-patterns** (12 KUs × 4 files each = 48 missing)
Missing: 04-standardized-knowledge.md, 05-rules.md, 08-anti-patterns.md, 09-checklists.md
- `aggregate-boundary-design`, `command-handler-patterns`
- `domain-event-patterns`, `domain-service-patterns`
- `entity-vs-value-object`, `factory-method-alternatives`
- `state-machine-patterns`, `strategy-pattern-in-domain`
- `temporal-modeling`, `transaction-script-refactoring`
- `transatlantic-specifications`, `ubiquitous-language-mapping`

### High: api-crud-system-engineering (45 missing)

**Subdomain: input-validation-architecture** (9 KUs × 5 files each = 45 missing)
Missing: 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 08-anti-patterns.md, 09-checklists.md
Only `07-decision-trees.md` exists for each.
- `form-request-customization-points`, `nested-object-validation`
- `rate-limiting-strategies`, `real-time-input-validation`
- `request-lifecycle-integration`, `validation-error-format-return-messages`
- `validation-rule-inheritance`, `validation-skip-on-edit`
- `validation-skip-on-null-update`

### High: data-storage-systems (42 missing)

**Subdomain: replication** (14 KUs × 3 files each = 42 missing)
Missing: 04-standardized-knowledge.md, 05-rules.md, 09-checklists.md
06-skills.md, 07-decision-trees.md, 08-anti-patterns.md exist.
- `7-10-multi-master-replication` through `7-20-peer-to-peer-replication`

### Medium: devops-infrastructure (6 missing)

**Subdomain: docker-containerization** (1 KU × 6 files = 6 missing)
- `docketfile-optimization` — likely misspelling of `dockerfile-optimization`

---

## Coverage Threshold Classification

| Classification | Coverage | Domains |
|---------------|----------|---------|
| Complete (100%) | 100% | 17 domains |
| Near-complete (95-99.9%) | 96.95%–97.92% | 3 domains (api-crud, data-storage, devops) |
| Action needed (<95%) | 92.20% | 1 domain (laravel-eloquent) |
