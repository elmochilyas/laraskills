# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Flaky Test Prevention
## Knowledge Unit: Flaky Test Prevention Strategies

---

### Tree 1: Flakiness Source Identification

```mermaid
flowchart TD
    A[Identify flakiness source] --> B{Failure pattern?}
    B -->|Passes locally, fails in CI| C{Timing related?}
    C -->|Yes — Dusk test, async assertion| D[Timing-dependent — replace pause() with waitFor()]
    C -->|No — database test, specific to CI env| E[Environment-dependent — check DB config, service containers]
    B -->|Passes in CI, fails locally| F[Local environment issue — check PHP version, DB engine, extensions]
    B -->|Fails intermittently everywhere| G{Root cause?}
    G -->|Time-based — fails at midnight/boundary| H[Time-dependent — add $this->freezeTime()]
    G -->|Order-based — fails in full suite, passes alone| I[State leakage — add RefreshDatabase]
    G -->|Network-based — fails when API is slow| J[Network-dependent — add Http::fake()]
    G -->|Data-based — fails on specific Faker output| K[Random data — use explicit values for asserted fields]
    A --> L{Frequency?}
    L -->|<5% of runs| M[Fix or track — monitor for worsening]
    L -->|5-25% of runs| N[Fix immediately — significant CI trust erosion]
    L -->|>25% of runs| O[Quarantine now — test is unreliable, protect CI trust]
```

**Key decision points:**
- **Timing → Dusk**: Replace `pause()` with `waitFor()`, `waitForText()`.
- **Time → freeze**: Add `$this->freezeTime()` for any time-sensitive assertion.
- **State leakage → RefreshDatabase**: Add database isolation trait for order-dependent failures.
- **Network → Http::fake()**: Fake all external HTTP interactions.

---

### Tree 2: Fix vs Quarantine vs Retry

```mermaid
flowchart TD
    A[Respond to flaky test] --> B{Root cause clear?}
    B -->|Yes — known pattern| C[Fix immediately — root cause is understood]
    B -->|No — unclear cause| D{Impact level?}
    D -->|High — blocks PRs frequently| E[Quarantine — move to separate suite, track with issue]
    D -->|Low — rare failure| F[Track with retry — use --retry, monitor retry rate]
    A --> G{Fix timeline?}
    G -->|Can fix in <1 day| H[Fix now — invest the time, maintain CI trust]
    G -->|Will take 1-5 days| I[Quarantine now + fix within 2 weeks — policy enforcement]
    G -->|No known fix| J[Quarantine indefinitely — test may need to be rewritten]
    A --> K{Retry rate<br>monitoring?}
    K -->|Retry rate >5%| L[Invest in fixes — retry is masking systemic flakiness]
    K -->|Retry rate <5%| M[Acceptable — retry is a safety net for rare flakiness]
```

**Key decision points:**
- **Fix immediately**: If root cause is clear. Time freezing, Http::fake, RefreshDatabase are quick fixes.
- **Quarantine**: Move to separate non-blocking suite when cause is unclear or fix takes time.
- **Retry**: Safety net for rare flakiness (<5%). Monitor retry rate to detect worsening.

---

### Tree 3: Database Isolation Strategy

```mermaid
flowchart TD
    A[Choose database isolation] --> B{Test type?}
    B -->|Feature test — full stack| C[RefreshDatabase — migrates + transaction rollback]
    B -->|Unit test — isolated class| D[No isolation needed — no database interaction]
    A --> E{Performance priority?}
    E -->|Speed — minimize overhead| F[DatabaseTransactions — faster, rollback only]
    E -->|Thoroughness — catch schema issues| G[RefreshDatabase — slower but comprehensive]
    A --> H{Parallel execution?}
    H -->|Yes — shards or parallel workers| I[DatabaseTruncation — Laravel 11+, faster for parallel]
    H -->|No — sequential execution| J[RefreshDatabase — standard, well-tested approach]
    A --> K{State leakage risk?}
    K -->|High — tests create and modify shared data| L[RefreshDatabase or DatabaseTruncation — full isolation]
    K -->|Low — tests are read-only| M[No isolation needed — read-only tests don't create state]
```

**Key decision points:**
- **RefreshDatabase**: Standard choice. Thorough (migrates + transactions). Slightly slower.
- **DatabaseTransactions**: Faster (no migration per suite). May miss schema issues.
- **DatabaseTruncation**: Laravel 11+. Faster for parallel execution than RefreshDatabase.

---

### Tree 4: Flaky Test Policy — Process and Culture

```mermaid
flowchart TD
    A[Establish flaky test policy] --> B{Tracking in place?}
    B -->|Yes — dashboard or CI integration| C[Monitor retry rate per test, per week]
    B -->|No — no tracking| D[Start with simple tracking: CI retry count per workflow]
    A --> E{Policy rules?}
    E -->|2-week fix deadline| F[Fix or quarantine within 2 weeks of first detection]
    E -->|Retry rate threshold| G[If retry rate >5%, automatic quarantine]
    E -->|Zero-tolerance policy| H[All flaky tests must be fixed before PR merge]
    A --> I{Accountability?}
    I -->|Assigned to test owner| J[Best — clear responsibility, tracked in issue tracker]
    I -->|Team collective responsibility| K[Works with strong team culture — may result in no one fixing]
    I -->|No owner assigned| L[Risky — flaky tests accumulate without accountability]
    A --> M{Quarantine process?}
    M -->|Move to separate CI job| N[Slow tests still run — non-blocking, tracked separately]
    M -->|Delete the test| O[Last resort — only if test is genuinely untestable]
```

**Key decision points:**
- **Tracking**: Must have visibility into flaky test frequency. Without tracking, flakiness is invisible.
- **Fix deadline**: 2 weeks is recommended. Longer = accumulating flake debt.
- **Accountability**: Assigned ownership is most effective. Collective ownership works in disciplined teams.
