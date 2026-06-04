# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: Parallel Test Sharding in CI

---

### Tree 1: Sharding vs No Sharding

```mermaid
flowchart TD
    A[Decide whether to shard tests] --> B{Test suite wall time?}
    B -->|<5 minutes| C[No sharding needed — overhead negates benefit]
    B -->|5-10 minutes| D[Consider sharding — may provide modest improvement]
    B -->|>10 minutes| E[Sharding recommended — significant time savings]
    A --> F{Parallelism capacity?}
    F -->|Abundant — many runners available| G[Sharding beneficial — utilize parallel capacity]
    F -->|Limited — constrained runners| H[May not benefit — shards queue sequentially]
    A --> I{Db isolation possible?}
    I -->|Yes — per-shard databases| J[Ready for sharding — no cross-shard collisions]
    I -->|No — shared database| K[Fix DB isolation first — shared DB causes flaky failures]
    A --> L{Test organization?}
    L -->|Many small test files| M[Shards balance well — good distribution]
    L -->|Few large test files| N[Split large files first — single-file bottlenecks]
```

**Key decision points:**
- **Threshold**: Shard when suite >10 minutes. Under 5 minutes, overhead negates benefit.
- **Database isolation**: Mandatory prerequisite. Shared databases cause parallel collision failures.
- **Test file size**: Large files (>2 min runtime) must be split before effective sharding.

---

### Tree 2: Shard Count Selection

```mermaid
flowchart TD
    A[Choose number of shards] --> B{Suite wall time?}
    B -->|10-15 minutes| C[4 shards — good starting point]
    B -->|15-30 minutes| D[4-6 shards — monitor slowest shard]
    B -->|30-60 minutes| E[8 shards — significant parallelism]
    B -->|>60 minutes| F[8-12 shards — diminishing returns beyond 8]
    A --> G{Two-level parallelism?}
    G -->|Yes — also using --parallel within shards| H[Fewer shards needed — internal parallelism helps]
    G -->|No — single process per shard| I[More shards needed — each shard runs one process]
    A --> J{Boot overhead per shard?}
    J -->|Low — fast framework boot| K[More shards feasible — overhead minimal]
    J -->|High — slow database migrations, config| L[Fewer shards — overhead dominates small shards]
    A --> M{Monitor and<br>adjust?}
    M -->|Yes — watch slowest shard| N[Optimal — rebalance by splitting large files or adding shards]
    M -->|No — set and forget| O[Suboptimal — imbalance may waste capacity]
```

**Key decision points:**
- **Start with 4**: 10-15 minute suites → 4 shards. Larger suites → 6-8 shards.
- **Diminishing returns**: Beyond 8 shards, framework boot overhead reduces marginal benefit.
- **Two-level parallelism**: Combining sharding (CI jobs) with `--parallel` (processes) reduces needed shard count.

---

### Tree 3: Database Isolation Strategy

```mermaid
flowchart TD
    A[Configure database per shard] --> B{Driver?}
    B -->|MySQL/PostgreSQL| C[Parameterize DB_DATABASE per shard]
    B -->|SQLite in-memory| D[Isolation automatic — each process has own memory]
    A --> E{Parameterization approach?}
    E -->|GitHub Actions matrix| F[DB_DATABASE: testing_${{ matrix.shard }} — clean, simple]
    E -->|Manual script| G[Create databases dynamically in CI setup step]
    A --> H{Collision risk?}
    H -->|Multiple shards on same table| I[High — race conditions, inconsistent reads, duplicate records]
    H -->|Each shard has isolated DB| J[Nil — no cross-shard data access]
    A --> K{Coverage consideration?}
    K -->|Coverage collected| L[Each shard generates partial coverage file — upload as artifact]
    K -->|No coverage needed| M[Simple sharding — run tests, report pass/fail]
```

**Key decision points:**
- **MySQL/PostgreSQL**: Parameterize DB_DATABASE per shard. `testing_1`, `testing_2`, etc.
- **SQLite**: Isolation is automatic with in-memory databases. Each process has its own memory space.
- **Coverage**: Each shard generates partial coverage. Merge in a final job for accurate reporting.

---

### Tree 4: Fail-Fast Setting

```mermaid
flowchart TD
    A[Configure fail-fast behavior] --> B{Goal?}
    B -->|Complete failure picture| C[fail-fast: false — all shards run, all failures reported]
    B -->|Fastest possible feedback| D[fail-fast: true — stop on first failure]
    A --> E{CI runner cost?}
    E -->|Paid — per-minute billing| F[fail-fast: true saves cost by cancelling remaining shards]
    E -->|Free — included minutes| G[fail-fast: false preferred — complete picture worth the minutes]
    A --> H{Team workflow?}
    H -->|Fix and re-run| I[fail-fast: true — save minutes, fix one failure at a time]
    H -->|Batch fixes in one branch| J[fail-fast: false — see all failures, fix in one pass]
    A --> K{Merge criticality?}
    K -->|High — must be comprehensive| L[fail-fast: false — mandatory for merge to main]
    K -->|Low — quick iteration| M[fail-fast: true acceptable — iterate quickly]
```

**Key decision points:**
- **Complete picture**: `fail-fast: false` — see all failures in one run. Fix in one pass.
- **Cost saving**: `fail-fast: true` — cancel remaining shards on first failure. Saves CI minutes.
- **Merge to main**: Always use `fail-fast: false`. Merges must have complete failure information.
