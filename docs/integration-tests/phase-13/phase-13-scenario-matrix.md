# Phase 13 — Scenario Matrix

## Overview

Six paired scenarios testing distinct Laravel engineering domains. Each scenario compares a baseline (no ECC) and an ECC-assisted implementation.

## Matrix

| # | Scenario | Domain | File | Prompt Focus | Key Risks |
|---|----------|--------|------|-------------|-----------|
| 1 | Sanctum Authentication API | Security & Identity Engineering | `prompts/01-sanctum-auth-api.txt` | Token auth, registration, login, logout, /me | Password hashing, token revocation, validation |
| 2 | Queued Email with Retries | Async & Distributed Systems | `prompts/02-queued-email-idempotency.txt` | Queue workflow, retries, idempotency | Duplicate dispatch, failure handling, fakes |
| 3 | Signed Webhook with Replay Protection | API Integration Engineering | `prompts/03-signed-webhook.txt` | HMAC verification, replay protection, queue | Timing-safe comparison, timestamp drift, idempotency |
| 4 | Eloquent N+1 Optimization | Laravel Eloquent Domain Modeling | `prompts/04-eloquent-n-plus-one.txt` | Eager loading, query count, pagination | Hidden N+1 in Resources, missing pagination |
| 5 | Multi-Tenant Data Isolation | Backend Architecture Design | `prompts/05-multi-tenant-isolation.txt` | Tenant scope, cross-tenant prevention, policies | Leaky route-model binding, missing tenant context |
| 6 | Laravel AI SDK RAG Workflow | AI Intelligence Systems | `prompts/06-laravel-ai-rag-workflow.txt` | Document/chunk models, ingestion, retrieval, provider boundary | Unavailable AI SDK APIs, live API calls, fake difficulty |

## Worktree Layout

```
<lab-root>/worktrees/
  sanctum-auth/
    baseline/          (fresh from clean Laravel baseline commit)
    ecc-assisted/      (fresh from clean Laravel baseline commit)
  queued-email/
    baseline/
    ecc-assisted/
  signed-webhook/
    baseline/
    ecc-assisted/
  eloquent-n-plus-one/
    baseline/
    ecc-assisted/
  multi-tenant-isolation/
    baseline/
    ecc-assisted/
  rag-workflow/
    baseline/
    ecc-assisted/
```

## Run Count

- 6 scenarios × 2 runs = 12 total runs
- Each run is fully independent (separate worktree, separate OpenCode session)
- No code sharing between runs

## Prompt Structure

Each prompt file contains:

1. **Base requirements** — exact behavior to implement
2. **Laravel conventions** — framework-native patterns
3. **Testing requirements** — feature tests, fakes, assertions
4. **Output format** — "concise implementation summary"

ECC-assisted prompts append the standard ECC instruction (see methodology).
