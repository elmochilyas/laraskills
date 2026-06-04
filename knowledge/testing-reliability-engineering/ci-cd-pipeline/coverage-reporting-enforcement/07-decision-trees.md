# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: Coverage Reporting & Enforcement

---

### Tree 1: Coverage Tool Selection — pcov vs Xdebug

```mermaid
flowchart TD
    A[Choose coverage driver] --> B{Primary use case?}
    B -->|Coverage-only in CI| C[pcov — 20-40% overhead, purpose-built for coverage]
    B -->|Step debugging + coverage| D[Xdebug — both capabilities, 200-500% overhead]
    A --> E{CI setup?}
    E -->|shivammathur/setup-php| F[Install pcov: coverage: pcov]
    E -->|Custom Docker image| G[Install pcov via pecl: pecl install pcov]
    A --> H{Parallel tests?}
    H -->|Yes — parallel or sharded| I[pcov works with coverage merging]
    H -->|No — single process| J[Either tool works, pcov preferred]
    A --> K{CI speed<br>critical?}
    K -->|Yes — must minimize CI time| L[pcov — 1-2 min overhead vs 10-25 min for Xdebug]
    K -->|No — CI time is flexible| M[Either acceptable, but pcov still preferred]
```

**Key decision points:**
- **Coverage-only → pcov**: pcov is purpose-built for coverage with minimal overhead.
- **Debugging needed → Xdebug**: Xdebug supports both step debugging and coverage, but coverage is much slower.
- **CI speed**: pcov adds 1-2 minutes vs Xdebug's 10-25 minutes to a 5-minute test suite.

---

### Tree 2: Threshold Strategy — Baseline vs Target

```mermaid
flowchart TD
    A[Set coverage threshold] --> B{Project type?}
    B -->|Greenfield — new project| C[Set --min=80 from day one]
    B -->|Existing — has coverage data| D[Compute current coverage first]
    D --> E{Current coverage<br>level?}
    E -->|≥80%| F[Set --min=80 — maintain current level]
    E -->|50-79%| G[Set --min at current level — prevent regression]
    E -->|<50%| H[Set --min at baseline or slightly below — start somewhere]
    A --> I{Improvement plan?}
    I -->|Gradual — raise quarterly| J[Set +5% target each quarter — sustainable progress]
    I -->|Immediate — enforce now| K[May cause team to disable coverage check — risky]
    A --> L{Critical paths<br>considered?}
    L -->|Yes — different thresholds| M[Set 90%+ for payments, auth; 70% for rest]
    L -->|No — single threshold| N[Single project-wide threshold — simpler, less granular]
```

**Key decision points:**
- **Greenfield → 80%**: New projects can enforce 80% from the start.
- **Existing → baseline**: Compute current coverage and use it as baseline. Raise gradually.
- **Gradual improvement**: Raise by 5% per quarter. Immediate enforcement causes teams to disable the check.

---

### Tree 3: CI Placement — Local vs CI Coverage

```mermaid
flowchart TD
    A[Decide where to run coverage] --> B{When?}
    B -->|During TDD — every few seconds| C[NEVER run coverage locally — 20-40% overhead disrupts flow]
    B -->|In CI — per commit/PR| D[ALWAYS run coverage in CI — enforcement gate]
    B -->|Scheduled — weekly full scan| E[Run comprehensive coverage with HTML report]
    A --> F{Parallelism?}
    F -->|Parallel tests| G[Use Pest's parallel coverage merging or PHPUnit's --coverage-php]
    F -->|Single process| H[Standard --coverage flag — sufficient]
    A --> I{Report storage?}
    I -->|CI artifact| J[Store HTML or Clover report for team review]
    I -->|External service| K[Codecov, Coveralls, SonarQube — trend tracking]
    A --> L{Coverage only or<br>+ mutation?}
    L -->|Coverage only| M[Minimum gate — ensures code is executed]
    L -->|Coverage + mutation| N[Stronger gate — ensures code is executed AND verified]
```

**Key decision points:**
- **Local**: Never run coverage during TDD. The 20-40% overhead slows the development loop.
- **CI**: Always run coverage in CI. Enforcement gate prevents regression.
- **Parallel merging**: Use Pest's built-in coverage merging or PHPUnit's coverage cache for parallel tests.

---

### Tree 4: Report Format Selection

```mermaid
flowchart TD
    A[Choose coverage report format] --> B{Consumer?}
    B -->|Team review — visual browsing| C[HTML report — browse by file, see uncovered lines]
    B -->|CI platform integration| D[Clover XML — SonarQube, GitLab, Jenkins]
    B -->|Terminal — quick check| E[Text format — summary percentages per file]
    B -->|Trend tracking| F[Send to Codecov, Coveralls, or similar service]
    A --> G{Storage?}
    G -->|CI artifact| H[HTML or Clover — configurable retention period]
    G -->|Public access (open source)| I[Codecov badge — visible, but restrict if proprietary]
    A --> J{Multiple formats<br>needed?}
    J -->|Yes| K[Generate multiple formats: --coverage-html + --coverage-clover]
    J -->|No| L[Single format based on consumer requirements]
    A --> M{Compliance?}
    M -->|Yes — audit trail required| N[HTML + Clover archived with timestamps]
    M -->|No — internal improvement| O[HTML artifact sufficient — team-driven review]
```

**Key decision points:**
- **HTML for team review**: Most accessible format. Browse by file, see uncovered lines.
- **Clover for CI platforms**: Required by SonarQube, GitLab, Jenkins integrations.
- **Public vs private**: Open-source projects can use Codecov badges. Private projects should restrict artifact access.
