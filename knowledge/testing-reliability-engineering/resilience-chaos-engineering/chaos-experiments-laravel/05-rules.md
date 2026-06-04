# Rules — Chaos Experiments with Laravel Bazooka

## Rule 1: Never Enable Bazooka in Production Environment
| Field | Value |
|-------|-------|
| **Name** | Never Enable Bazooka in Production Environment |
| **Category** | Safety & Environment |
| **Rule** | Ensure Bazooka is enabled only for `local` and `testing` environments. Use multi-layer gating: config check + CI variable + runtime `APP_ENV` assertion. Never set `BAZOOKA_ENABLED=true` in production. |
| **Reason** | Bazooka injects real failures (exceptions, latency, random values) that would cause production outages, data corruption, and user-facing errors. Multi-layer gating prevents accidental production enablement through a single misconfiguration. |
| **Bad Example** | Single `BAZOOKA_ENABLED=true` environment variable — accidentally set in production; real users experience failures. |
| **Good Example** | `'enabled' => env('BAZOOKA_ENABLED', false) && app()->environment('local', 'testing')` — multiple layers prevent production activation. |
| **Exceptions** | None. Bazooka must never run in production. |
| **Consequences Of Violation** | Production outage; data corruption; real users experience chaos-induced failures. |

## Rule 2: Use 1-5% Probability for CI Chaos Experiments
| Field | Value |
|-------|-------|
| **Name** | Use 1-5% Probability for CI Chaos Experiments |
| **Category** | CI & Reliability |
| **Rule** | Configure chaos experiment probabilities at 1-5% for CI runs. Use higher probabilities (25-100%) only for targeted local experiments. |
| **Reason** | High probability in CI makes every test run unpredictable — some fail due to chaos, some pass. This reduces trust in CI results. Low probability (1-5%) discovers untested failure modes over multiple runs without making CI unreliable. Each individual run is mostly deterministic. |
| **Bad Example** | Setting `probability: 0.5` in CI — 50% of test runs fail due to chaos; team blames CI, not test quality. |
| **Good Example** | CI: `probability: 0.02` (2%). Local development: `probability: 0.5` (50%) for targeted testing. |
| **Exceptions** | Scheduled chaos-only CI runs (separate from main CI) where high probability is acceptable. |
| **Consequences Of Violation** | Flaky CI; team loses trust in CI results; chaos testing becomes counterproductive. |

## Rule 3: Log Every Chaos Injection
| Field | Value |
|-------|-------|
| **Name** | Log Every Chaos Injection |
| **Category** | Observability & Debugging |
| **Rule** | Configure chaos injection logging with chaos point name, disruption type, value, and timestamp. Never run chaos experiments without logging. |
| **Reason** | When a test fails during chaos, you must know whether the failure was caused by chaos injection or a real bug. Without logging, you can't distinguish "chaos-induced failure" (expected) from "real regression" (unexpected). Logging enables this distinction and aids debugging. |
| **Bad Example** | Chaos test fails — no log entry; team doesn't know if it's chaos or a real bug. |
| **Good Example** | Log entry: `{ chaos_point: 'PaymentGateway::charge', disruption: 'latency', value: 3000ms, timestamp: '2026-06-02T10:00:00Z' }` — clear attribution. |
| **Exceptions** | None. Always log chaos injections. |
| **Consequences Of Violation** | Chaos-caused failures indistinguishable from real bugs; wasted debugging time. |

## Rule 4: Mix Disruption Types — Don't Only Use Exceptions
| Field | Value |
|-------|-------|
| **Name** | Mix Disruption Types — Don't Only Use Exceptions |
| **Category** | Coverage & Realism |
| **Rule** | Use multiple disruption types across chaos experiments: exceptions, latency, random values, null returns, and empty responses. Never use only exception disruptions. |
| **Reason** | Real-world failures are varied. Exceptions (service crash) are one failure mode. Slow responses (latency), partial data (null returns), and empty datasets are equally common and have different code paths. Testing only exceptions leaves latency, null pointer, and empty state handling unverified. |
| **Bad Example** | All chaos points use `disruption: 'exception'` only — latency-related bugs and null pointer issues go undetected. |
| **Good Example** | Mix: exception on payment gateway, latency on email, null on user lookup, empty on search results. |
| **Exceptions** | Specific services where only one disruption type is realistic (e.g., a cache service only fails via latency). |
| **Consequences Of Violation** | Latency, null pointer, and empty state handling are untested; real-world diverse failures still cause bugs. |

## Rule 5: Review Chaos Configuration Quarterly
| Field | Value |
|-------|-------|
| **Name** | Review Chaos Configuration Quarterly |
| **Category** | Maintenance & Currency |
| **Rule** | Schedule quarterly review of all Bazooka chaos configurations. Update chaos points that reference renamed, removed, or refactored classes and methods. |
| **Reason** | Code changes (class renames, method refactors, service removals) make chaos points stale. A chaos point targeting a deleted method doesn't inject any chaos — it silently becomes a no-op. Quarterly review ensures all chaos points are still active and targeting the right code. |
| **Bad Example** | `PaymentGateway` class renamed to `PaymentProcessor` — chaos point targeting `PaymentGateway::charge` is silently inactive for 6 months. |
| **Good Example** | Quarterly review: run `php artisan bazooka:discover`, diff against current config, update stale targets. |
| **Exceptions** | Projects with automated chaos point validation in CI (verify chaos points against actual codebase). |
| **Consequences Of Violation** | Chaos points silently stop working; resilience testing coverage degrades unnoticed. |

## Rule 6: Run Chaos CI as a Separate Scheduled Workflow
| Field | Value |
|-------|-------|
| **Name** | Run Chaos CI as a Separate Scheduled Workflow |
| **Category** | CI & Pipeline |
| **Rule** | Run Bazooka chaos experiments in a separate GitHub Actions workflow scheduled (nightly/weekly), not in the main PR test workflow. |
| **Reason** | Chaos experiments may fail non-deterministically due to probability-based injection. Including them in the main CI would cause random CI failures unrelated to the PR's code changes. A scheduled workflow provides regular resilience validation without blocking developer velocity. |
| **Bad Example** | Including Bazooka chaos in `ci.yml` (PR workflow) — random failures block PRs for unrelated changes. |
| **Good Example** | Separate `chaos.yml` workflow: `on: schedule: [{ cron: '0 6 * * 1' }]` — weekly resilience validation. |
| **Exceptions** | Teams that use deterministic fault injection (100% probability) for specific resilience tests in the main CI. |
| **Consequences Of Violation** | Random CI failures; developer frustration; chaos testing disabled to restore CI reliability. |
