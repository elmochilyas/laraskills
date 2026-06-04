# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Query Sentinel

---

### Tree 1: Which Detection Types to Enable

```mermaid
flowchart TD
    A[Start Query Sentinel setup] --> B{Is this a new or<br>existing project?}
    B -->|New project| C[Enable N+1 + duplicate + slow query]
    B -->|Existing project| D[Enable N+1 detection only]
    D --> E[Run test suite and build exclusion list]
    E --> F{Clean baseline<br>established?}
    F -->|No| G[Tune exclusions; rerun]
    F -->|Yes| H[Add duplicate query detection]
    H --> I[Add slow query detection]
    I --> J{Need EXPLAIN-level<br>analysis?}
    J -->|Yes| K[Enable full table scan + missing index<br>in dedicated performance suite]
    J -->|No| L[Stop — current detection is sufficient]
```

**Key decision points:**
- **Existing vs new project**: Existing projects need incremental enablement to avoid false-positive overload. New projects have less legacy code and can start with broader detection.
- **EXPLAIN-level detection**: Full table scan and missing index detection add 1-10ms per SELECT query. Reserve for dedicated performance test suites.
- **Baseline first**: Without a clean baseline, every detection type generates noise that undermines trust in Sentinel.

---

### Tree 2: Warning vs Exception Mode

```mermaid
flowchart TD
    A[Choose Sentinel mode] --> B{Where is Sentinel<br>running?}
    B -->|Local development| C[Use log/warning mode]
    B -->|CI pipeline| D{Team maturity<br>level?}
    D -->|Mature — low false positives| E[Use exception mode]
    D -->|Still tuning exclusions| F[Use warning mode with CI artifact review]
    B -->|Production| G[Disabled — never enable]
    C --> H[Developers see warnings without workflow disruption]
    E --> I[PRs blocked on query regressions]
    F --> J[Warnings logged; team reviews periodically]
```

**Key decision points:**
- **Development vs CI**: Warnings preserve developer velocity in local dev. Exceptions enforce standards in CI.
- **Team maturity**: Teams with well-tuned exclusion lists can use exception mode everywhere. Teams still tuning should use warning mode even in CI, reviewing logs periodically.

---

### Tree 3: How to Build the Exclusion List

```mermaid
flowchart TD
    A[Build Sentinel exclusion list] --> B[Run full test suite with N+1 detection in log mode]
    B --> C[Collect all flagged query patterns]
    C --> D{Is this an internal<br>Laravel query?}
    D -->|Yes — migrations, sessions, cache| E[Add to exclusion list with comment]
    D -->|No — application query| F{Is this a known<br>false positive?}
    F -->|Yes| G[Add narrow exclusion pattern]
    F -->|No| H[Fix the query — don't exclude real issues]
    E --> I[Review exclusions quarterly]
    G --> I
    I --> J{Exclusion still<br>necessary?}
    J -->|Yes| K[Keep with updated justification]
    J -->|No| L[Remove exclusion to restore coverage]
```

**Key decision points:**
- **Internal vs application query**: Internal Laravel queries are safe to exclude. Application queries flagged by Sentinel should be fixed, not excluded.
- **Narrow vs broad exclusions**: Use specific patterns (e.g., `migrations_*`) not generic ones (`%`). Review quarterly to prevent exclusion list bloat.

---

### Tree 4: Sentinel vs `expectsDatabaseQueryCount()` — Which to Use

```mermaid
flowchart TD
    A[Database query quality strategy] --> B{What are you<br>trying to catch?}
    B -->|Unexpected new patterns| C[Use Query Sentinel]
    B -->|Gradual query count inflation| D[Use expectsDatabaseQueryCount]
    B -->|Both — comprehensive coverage| E[Use both together]
    C --> F[Sentinel detects N+1, duplicates, slow queries]
    D --> G[Assertions enforce exact query budgets]
    E --> H[Sentinel catches new patterns; assertions prevent inflation]
    H --> I{Running in CI?}
    I -->|Yes| J[Exception mode for both]
    I -->|No, development| K[Warning mode for Sentinel; assertions always strict]
```

**Key decision points:**
- **Pattern detection vs budget enforcement**: Sentinel catches what you didn't know about. Query count assertions enforce what you know. They complement, not replace.
- **CI vs development**: Both should be active in CI. In development, assertions remain strict but Sentinel can be in warning mode.
