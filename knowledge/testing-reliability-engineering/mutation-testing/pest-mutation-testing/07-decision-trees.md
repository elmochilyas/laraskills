# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Mutation Testing
## Knowledge Unit: Pest Mutation Testing

---

### Tree 1: Pest Mutation vs Infection — Which to Use

```mermaid
flowchart TD
    A[Choose mutation testing tool] --> B{Are you just starting<br>with mutation testing?}
    B -->|Yes| C[Use Pest mutation — zero config, built-in]
    B -->|No — experienced| D{Need advanced features?}
    D -->|Custom mutators, baseline, differential| E[Use Infection PHP]
    D -->|No — basic mutation is enough| F[Stay with Pest mutation]
    C --> G[covers() + --mutate + --min — all you need]
    E --> H[infection.json, custom mutators, parallel execution]
    F --> I[Same mutators under the hood — quality is identical]
    A --> J{Parallel execution<br>needed?}
    J -->|Yes — large codebase| K[Infection with --threads is faster]
    J -->|No — targeted mutation| L[Pest mutation speed is acceptable]
```

**Key decision points:**
- **Start with Pest mutation**: Zero configuration, built-in, uses same mutators as Infection.
- **Graduate to Infection**: Only when needing custom mutators, baselines, or parallel execution at scale.
- **Mutation quality**: Identical between Pest mutation and Infection — they share mutators.

---

### Tree 2: Which Classes to Target with Mutation

```mermaid
flowchart TD
    A[Target mutation testing] --> B{What type of class?}
    B -->|Service / Action| C[Highest ROI — business logic]
    B -->|Model with scopes/computed| D[Good ROI — complex model logic]
    B -->|Controller| E[Lower ROI — thin logic, HTTP routing]
    B -->|DTO / View Model| F[Lowest ROI — data transfer, no logic]
    C --> G[Prioritize: InvoiceService, PaymentAction, OrderProcessor]
    D --> H[Test: scopes, accessors, casts, events]
    E --> I[Covers auth + validation + response — minimal mutation benefit]
    A --> J{Critical to security<br>or billing?}
    J -->|Yes| K[Mutation target immediately with 80%+ MSI target]
    J -->|No| L[Standard priority — 60-70% MSI target]
```

**Key decision points:**
- **Services and actions first**: Highest mutation impact — business logic with real decision trees.
- **Controllers last**: Controllers are thin HTTP routing layers. Mutation here provides low value.
- **Security-critical code**: Always target first. A surviving mutation in auth/billing is a real risk.

---

### Tree 3: Setting MSI Thresholds

```mermaid
flowchart TD
    A[Set MSI threshold] --> B{What is the current<br>mutation score?}
    B -->|Don't know yet| C[Run --mutate to establish baseline]
    B -->|30-50%| D[Set --min=50 — achievable improvement target]
    B -->|50-70%| E[Set --min=60 — push for incremental gain]
    B -->|70-85%| F[Set --min=75 — approaching solid coverage]
    B -->|85%+| G[Set --min=80 — well-tested codebase]
    C --> H[Ship with current score; raise threshold quarterly]
    A --> I{Is this a critical<br>code path?}
    I -->|Yes — auth, billing, compliance| J[Target 80%+ from the start]
    I -->|No — standard business logic| K[60-70% is acceptable starting point]
    A --> L{Team will review<br>survivors?}
    L -->|Yes| M[Lower threshold acceptable — team improves over time]
    L -->|No — CI only check| N[Set threshold high — no human safety net]
```

**Key decision points:**
- **Baseline first**: Never set a threshold without knowing the current score.
- **Critical vs standard**: Critical paths need 80%+. Standard logic starts at 60%.
- **Human review matters**: If the team reviews survivors, lower thresholds are acceptable.

---

### Tree 4: When to Run Mutation in CI

```mermaid
flowchart TD
    A[Schedule mutation in CI] --> B{What CI event?}
    B -->|Every commit/PR| C[Mutation too slow — run only with --filter on critical paths]
    B -->|Nightly| D[Run full targeted mutation suite — services + actions]
    B -->|Pre-release| E[Run comprehensive mutation — all covered paths]
    C --> F[--mutate --min=70 --filter=CriticalServiceTest]
    D --> G[php artisan test --mutate on targeted test directory]
    E --> H[Consider Infection with parallel execution for full analysis]
    A --> I{CI stage?}
    I -->|After unit tests| J[Good — mutation assumes all tests pass]
    I -->|Before lint| K[Wrong — lint fails faster; mutation comes after]
    A --> L{Mutation causes CI<br>timeout?}
    L -->|Yes — too slow| M[Reduce scope: fewer classes, higher threshold, nightly only]
    L -->|No — acceptable| N[Current schedule is fine]
```

**Key decision points:**
- **Per-commit**: Too slow for full suite. Use `--filter` for targeted critical paths.
- **Nightly**: Best for comprehensive mutation runs. Review survivors the next day.
- **Pre-release**: Consider Infection with parallel threads for comprehensive analysis before releases.
