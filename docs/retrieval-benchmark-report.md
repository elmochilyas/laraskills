# ECC Retrieval Benchmark Report

## Overview

The benchmark suite evaluates the retrieval engine against 65 deterministic Laravel engineering tasks covering all 21 domain families.

## Benchmark Configuration

- **File:** `tests/retrieval/fixtures/benchmark-tasks.json`
- **Task count:** 65
- **Runner:** `tests/retrieval/run-benchmarks.mjs`
- **Evaluation criteria:**
  - Primary domain routing accuracy
  - Supporting domain identification
  - Forbidden domain avoidance
  - Top KU inclusion

## Task Coverage

| Category | Tasks | Coverage |
|---|---|---|
| Core Laravel (CRUD, controllers, validation) | 4 | ✓ |
| Eloquent & Database (N+1, indexes, modeling) | 6 | ✓ |
| Security (Sanctum, Gates, RBAC, secrets) | 4 | ✓ |
| Async & Real-Time (queues, jobs, broadcasting, Reverb) | 4 | ✓ |
| Testing (Pest, Dusk, regression, mutation) | 4 | ✓ |
| DevOps & Observability (CI/CD, logging, monitoring) | 4 | ✓ |
| AI & Search (vector, RAG, embeddings, LLM safety) | 4 | ✓ |
| API & Integration (REST, versioning, webhooks, rate limiting) | 4 | ✓ |
| Architecture (DDD, CQRS, hexagonal, modular monolith) | 4 | ✓ |
| Database (MySQL, PostgreSQL, sharding, multi-tenancy) | 4 | ✓ |
| Performance (Octane, caching, profiling, EXPLAIN) | 3 | ✓ |
| Security & Compliance (GDPR, RBAC, audit) | 3 | ✓ |
| Other domains (Events, DTOs, Service layer, CLI) | 17 | ✓ |

## Running Benchmarks

```bash
node tests/retrieval/run-benchmarks.mjs
```

## Expected Results

Each benchmark task defines:
- **`expectedPrimaryDomain`** — The primary domain that must be among the selected domains
- **`expectedSupportingDomains`** — Supporting domains that should appear
- **`forbiddenDomains`** — Domains that should NOT appear as primary
- **`expectedTopKus`** (optional) — Specific KUs that should appear in top results

## Scoring

Each task is scored as pass/fail:
- **Pass:** Primary domain found, supporting domains present, no forbidden domains as primary
- **Fail:** Primary domain missing or forbidden domain routed as primary

## Pass Rate Target

The retrieval engine is designed to achieve:
- **Primary domain routing:** >90% accuracy
- **Supporting domain identification:** >70% accuracy
- **Forbidden domain avoidance:** >95% avoidance

## Continuous Validation

The benchmark suite serves as a regression test suite. Run after any changes to:
- Scoring weights
- Domain routing rules
- Query analysis keywords
- Alias resolution logic
