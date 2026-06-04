# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: CI Test Execution Strategies

---

### Tree 1: Sequential vs Parallel Execution

```mermaid
flowchart TD
    A[Choose test execution strategy] --> B{Test suite size?}
    B -->|<5 minutes| C[Sequential — simple, no overhead, sufficient]
    B -->|5-15 minutes| D[Parallel within job — Pest --parallel, Paratest]
    B -->|>15 minutes| E[Sharding + parallel — distribute across CI jobs + processes]
    A --> F{Database isolation<br>possible?}
    F -->|Yes — per-process/shard DB| G[Parallel execution safe — no cross-process collisions]
    F -->|No — shared database| H[Sequential only — parallel causes random failures]
    A --> I{CI runner resources?}
    I -->|Abundant — multi-core| J[Parallel execution utilizes available cores efficiently]
    I -->|Limited — single-core| K[Sequential may be same speed as parallel — context switching overhead]
    A --> L{Consistency requirement?}
    L -->|High — must be deterministic| M[Sequential — guaranteed order, no race conditions]
    L -->|Acceptable — small race window| N[Parallel with database isolation — mostly deterministic]
```

**Key decision points:**
- **Suite size drives strategy**: <5 min → sequential. 5-15 min → parallel. >15 min → sharding + parallel.
- **Database isolation**: Mandatory for parallel execution. Without it, tests collide on shared tables.
- **Determinism**: Sequential tests are most deterministic. Parallel tests need careful isolation.

---

### Tree 2: Shard Count vs Internal Parallelism

```mermaid
flowchart TD
    A[Choose shard count and parallelism] --> B{CI job count<br>available?}
    B -->|Many — 8+ concurrent jobs| C[More shards, less internal parallelism — simpler setup]
    B -->|Few — 2-4 concurrent jobs| D[Fewer shards, more internal parallelism — maximize each job]
    A --> E{Process overhead tolerance?}
    E -->|Low — framework boot is slow| F[Fewer shards — avoid repeated bootstrap overhead]
    E -->|High — fast boot, eager to parallelize| G[More shards — fine-grained distribution]
    A --> H{Coverage needed?}
    H -->|Yes — merged at end| I[More shards = more partial coverage files to merge — 10-30s merge overhead]
    H -->|No — pass/fail only| J[Simpler — no coverage merge step needed]
    A --> K{Trade-off analysis?}
    K -->|4 shards + --parallel 4| L[16 concurrent processes — good for 15-30 min suites]
    K -->|8 shards + --parallel 2| M[16 concurrent processes — better for 30-60 min suites with high boot overhead]
```

**Key decision points:**
- **Many CI jobs → more shards**: Distribute across jobs, minimize internal complexity.
- **Few CI jobs → more internal parallelism**: Maximize each job's resource utilization.
- **Combine both**: Two-level parallelism (sharding × process-level) maximizes throughput.

---

### Tree 3: CI Stage Design — Quality Gates

```mermaid
flowchart TD
    A[Design CI quality gates] --> B{Gate type?}
    B -->|Lint — Pint, PHP CS Fixer| C[Fastest gate — 2-10s, blocks all subsequent gates]
    B -->|Static analysis — PHPStan, Larastan| D[Medium gate — 2-5min, blocks test execution]
    B -->|Type checking — Psalm| E[Additional gate — optional, adds 1-3min]
    B -->|Tests — Pest, PHPUnit| F[Slowest gate — 5-15+ min, blocks deployment]
    B -->|Security — SAST, dependency audit| G[Parallel gate — runs alongside tests, blocks deploy]
    A --> H{Failure behavior?}
    H -->|Blocking — must pass to proceed| I[Required gates: lint, static analysis, tests]
    H -->|Advisory — warns but doesn't block| J[Optional gates: security with known false positives]
    A --> K{Deployment gate?}
    K -->|Auto-deploy on green CI| L[Deploy job after all gates pass, requires main branch]
    K -->|Manual approval required| M[environment: production with required reviewers]
```

**Key decision points:**
- **Gate order**: Fastest gates first (lint → static analysis → tests → deploy). Fail fast.
- **Blocking vs advisory**: Lint, analysis, tests are blocking. Some security checks can be advisory.
- **Deployment**: Requires all blocking gates to pass. Main branch only. Optional manual approval.

---

### Tree 4: Pre-Deploy vs Post-Deploy Testing

```mermaid
flowchart TD
    A[Choose pre or post-deploy tests] --> B{Environment?}
    B -->|Staging — pre-deployment| C[Full test suite before any deployment — catches regressions]
    B -->|Production — post-deployment| D[Smoke tests + health checks — catches env-specific issues]
    A --> E{Test type?}
    E -->|Unit/Feature tests| F[Pre-deploy only — no production dependency]
    E -->|Integration/E2E tests| G[Pre-deploy in staging — verify real service integration]
    E -->|Health checks| H[Post-deploy in production — verify env configuration]
    E -->|Smoke tests| I[Post-deploy in production — verify business transaction]
    A --> J{Failure recovery?}
    J -->|Pre-deploy failure| K[Block deployment — fix and re-deploy]
    J -->|Post-deploy failure| L[Automated rollback — revert to previous release]
    A --> M{Data considerations?}
    M -->|Pre-deploy uses test data| N[Safe — no production data impact]
    M -->|Post-deploy smoke test| O[Create + clean up test data — never leave artifacts in production]
```

**Key decision points:**
- **Pre-deploy**: Full test suite in staging/CI. Catches code regressions and integration issues.
- **Post-deploy**: Smoke tests and health checks in production. Catches environment-specific issues.
- **Failure recovery**: Pre-deploy → block deployment. Post-deploy → automated rollback.
