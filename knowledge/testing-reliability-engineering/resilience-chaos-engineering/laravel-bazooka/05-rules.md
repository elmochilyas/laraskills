# Rules — Laravel Bazooka Chaos Engineering

## Rule 1: Never Enable Bazooka in Production
| Field | Value |
|-------|-------|
| **Name** | Never Enable Bazooka in Production |
| **Category** | Safety & Environment |
| **Rule** | Use multi-layer environment gating to ensure Bazooka is never enabled in production. Check `APP_ENV`, configuration, and runtime assertions. |
| **Reason** | Bazooka injects real failures (exceptions, latency, random values) into application code. Enabling it in production would cause real outages, data corruption, and user-facing errors. Multi-layer gating prevents accidental production enablement through any single point of failure. |
| **Bad Example** | Single `BAZOOKA_ENABLED=true` environment variable — one misconfiguration causes production chaos. |
| **Good Example** | `'enabled' => env('BAZOOKA_ENABLED', false) && in_array(app()->environment(), ['local', 'testing'])`. |
| **Exceptions** | None. Bazooka must never run in production. |
| **Consequences Of Violation** | Real users experience fabricated failures; potential data corruption; production outage. |

## Rule 2: Use Seeded Randomness for Reproducibility
| Field | Value |
|-------|-------|
| **Name** | Use Seeded Randomness for Reproducibility |
| **Category** | Reliability & Debugging |
| **Rule** | Always configure a fixed random seed for Bazooka in test and CI environments. Never use unseeded randomness for chaos experiments. |
| **Reason** | Without a fixed seed, chaos behavior varies between runs — a test fails in CI run 1, passes in CI run 2, and fails locally. This makes debugging impossible. Fixed seeds ensure the same test run experiences the same failures, enabling reproducible debugging and verification. |
| **Bad Example** | `'seed' => null` in CI — chaos failures are random and unreproducible. |
| **Good Example** | `'seed' => env('BAZOOKA_SEED', 42)` — same seed produces the same chaos sequence every run. |
| **Exceptions** | Exploratory local development sessions where reproducibility is not required. |
| **Consequences Of Violation** | Unreproducible chaos failures; wasted debugging time on non-reproducible issues. |

## Rule 3: Use 1-5% Probability in CI, 25-100% Local
| Field | Value |
|-------|-------|
| **Name** | Use 1-5% Probability in CI, 25-100% Local |
| **Category** | CI & Reliability |
| **Rule** | Set chaos injection probability to 1-5% in CI workflows. Use 25-100% only for targeted local experiments. |
| **Reason** | High probability in CI makes every run unpredictable — some fail due to chaos, some pass. This destroys trust in CI results. Low probability discovers untested failure modes across multiple runs without making CI unreliable. Local high-probability runs allow developers to verify fallback handling deterministically. |
| **Bad Example** | CI probability: 50% — half of all CI runs fail; team disables chaos to restore CI reliability. |
| **Good Example** | CI: `probability: 0.02`. Local: `probability: 0.5` for testing specific fallback paths. |
| **Exceptions** | Scheduled dedicated chaos CI runs where high probability is the deliberate goal. |
| **Consequences Of Violation** | Flaky CI; team disables chaos testing; resilience validation is lost. |

## Rule 4: Log Every Chaos Injection
| Field | Value |
|-------|-------|
| **Name** | Log Every Chaos Injection |
| **Category** | Observability & Debugging |
| **Rule** | Log every chaos injection event with chaos point name, disruption type, value, and timestamp. Never run Bazooka without logging. |
| **Reason** | Chaos-caused failures must be distinguishable from real bugs. Without logging, every test failure during chaos is a mystery — was it the chaos or a regression? Logging provides definitive attribution and enables debugging. |
| **Bad Example** | Chaos test fails — no log entry; team debates whether the failure is chaos-induced or a real regression. |
| **Good Example** | Log: `{ chaos_point: 'PaymentGateway::charge', disruption: 'latency', value: 3000ms, timestamp: '2026-06-02T10:00:00Z' }`. |
| **Exceptions** | None. Always log chaos injections. |
| **Consequences Of Violation** | Indistinguishable chaos and regression failures; debugging confusion. |

## Rule 5: Run Chaos in a Separate CI Job
| Field | Value |
|-------|-------|
| **Name** | Run Chaos in a Separate CI Job |
| **Category** | CI & Pipeline |
| **Rule** | Run Bazooka chaos experiments in a separate CI job or scheduled workflow, not in the main test suite that blocks PRs. |
| **Reason** | Chaos experiments may fail non-deterministically (probability-based). Including them in the main CI would cause random failures unrelated to PR code changes, blocking deployment for unrelated work. A separate job provides resilience validation without blocking velocity. |
| **Bad Example** | Bazooka chaos included in `ci.yml` — random failures block PRs; team removes chaos to fix CI. |
| **Good Example** | Separate `chaos.yml` workflow: `on: schedule: [{ cron: '0 6 * * 1' }]` — weekly, non-blocking. |
| **Exceptions** | Deterministic fault injection tests (100% probability) that run in the main test suite. |
| **Consequences Of Violation** | Random CI failures; chaos testing disabled; resilience validation lost. |

## Rule 6: Review Chaos Points Quarterly
| Field | Value |
|-------|-------|
| **Name** | Review Chaos Points Quarterly |
| **Category** | Maintenance & Currency |
| **Rule** | Review all Bazooka chaos point configurations quarterly. Update targets that reference renamed, refactored, or removed classes and methods. |
| **Reason** | Chaos points target specific class::method combinations. When code is refactored (class renamed, method extracted, service replaced), the chaos point silently becomes a no-op — it injects no chaos because the target no longer exists. Without regular review, chaos coverage degrades unnoticed. |
| **Bad Example** | `UserRepository::findAll` renamed to `UserRepository::paginate` — chaos point `UserRepository::findAll` is dead for 8 months. |
| **Good Example** | `php artisan bazooka:discover` quarterly; diff against current config; update stale chaos points. |
| **Exceptions** | Projects with automated CI validation that verifies chaos points against actual codebase structure. |
| **Consequences Of Violation** | Chaos coverage silently degrades; resilience testing becomes ineffective. |
