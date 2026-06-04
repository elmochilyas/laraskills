# Rules — Chaos Engineering Concepts

## Rule 1: Start with Deterministic Fault Injection Before Probability-Based Chaos
| Field | Value |
|-------|-------|
| **Name** | Start with Deterministic Fault Injection Before Probability-Based Chaos |
| **Category** | Methodology & Progression |
| **Rule** | Implement deterministic fault injection (always throw exception) first. Add probability-based chaos only after deterministic tests pass consistently. |
| **Reason** | Deterministic faults establish baseline resilience — if the application can't handle a guaranteed failure, it's not ready for random intermittent failures. Probability-based chaos adds realism (real world failures are intermittent) but requires the deterministic baseline to be solid first. |
| **Bad Example** | Configuring 10% probability chaos on a service that hasn't been tested with deterministic 100% failure — unpredictable failures mask the lack of basic fallback. |
| **Good Example** | Step 1: `Resilience::fake(Service::class, 'method', ExceptionFault::class)` — test passes. Step 2: Add 5% probability Bazooka chaos. |
| **Exceptions** | Teams experienced in resilience testing who understand both patterns. |
| **Consequences Of Violation** | Unpredictable test failures; inability to distinguish resilience gaps from probability effects. |

## Rule 2: State a Clear Hypothesis Before Every Chaos Experiment
| Field | Value |
|-------|-------|
| **Name** | State a Clear Hypothesis Before Every Chaos Experiment |
| **Category** | Methodology & Rigor |
| **Rule** | Document the hypothesis for every chaos experiment before running it. The hypothesis must state the expected system behavior under the specific fault. |
| **Reason** | Without a hypothesis, a passing test gives false confidence — the system might have exhibited unexpected behavior that wasn't checked. The hypothesis defines what "correct" means under failure. It transforms chaos from "random testing" into "validated resilience." |
| **Bad Example** | "Let's see what happens when the payment gateway fails" — no expected outcome; any behavior passes. |
| **Good Example** | "When PaymentGateway::charge throws GatewayTimeoutException, the order transitions to `pending_payment` status, a retry job is dispatched, and the user sees 'Payment processing' screen." |
| **Exceptions** | Exploratory chaos sessions specifically designed to discover unknown failure modes (document findings afterward). |
| **Consequences Of Violation** | False confidence from passing tests that don't verify expected behavior. |

## Rule 3: Inject One Fault Per Experiment
| Field | Value |
|-------|-------|
| **Name** | Inject One Fault Per Experiment |
| **Category** | Experimental Design |
| **Rule** | Inject exactly one fault type in each chaos experiment. Never combine multiple faults in the same test. |
| **Reason** | Multiple faults make it impossible to determine which fault caused which behavior change. If both the database fails and the cache is slow, and the test fails, you can't attribute the failure to either cause. Each experiment should test exactly one failure scenario. |
| **Bad Example** | Injecting timeout on payment gateway AND exception on email service in the same test — checkout fails; unclear which fault caused it. |
| **Good Example** | Test 1: payment gateway timeout. Test 2: email service exception. Run independently. |
| **Exceptions** | Experiments designed to test resilience against multiple simultaneous failures (run after single-fault tests pass). |
| **Consequences Of Violation** | Inconclusive test results; inability to attribute failures to specific faults. |

## Rule 4: Run Chaos Experiments in a Separate CI Stage
| Field | Value |
|-------|-------|
| **Name** | Run Chaos Experiments in a Separate CI Stage |
| **Category** | CI & Pipeline |
| **Rule** | Run chaos experiments in a separate CI stage or scheduled workflow. Never include them in the main test suite that blocks PRs. |
| **Reason** | Chaos experiments inject latency and timeouts that make tests slower (100-500ms per injected fault). They may be flaky due to probability-based behavior. The main test suite must remain fast and deterministic. A separate CI stage allows chaos testing without degrading developer feedback. |
| **Bad Example** | Including chaos tests in `php artisan test` — 50 chaos tests with latency faults add 25+ seconds to every CI run. |
| **Good Example** | Separate CI job: `name: Chaos Engineering; schedule: cron('0 6 * * 1')` — weekly, non-blocking. |
| **Exceptions** | Deterministic fault injection tests (Resilience::fake) that complete in milliseconds without latency injection. |
| **Consequences Of Violation** | Slow main test suite; developer frustration; eventual removal of chaos tests. |

## Rule 5: Use Fixed Random Seeds for Reproducibility
| Field | Value |
|-------|-------|
| **Name** | Use Fixed Random Seeds for Reproducibility |
| **Category** | Reliability & Debugging |
| **Rule** | Always use a fixed random seed for probability-based chaos experiments in test mode. Never use unseeded randomness. |
| **Reason** | Unseeded randomness makes chaos failures non-reproducible — a test fails in CI but passes locally because the random seed was different. Fixed seeds ensure the same test run experiences the same failures, enabling debugging and verification of fixes. |
| **Bad Example** | Chaos config without `seed` — CI run 1 fails, CI run 2 passes, local run 3 passes; unreproducible. |
| **Good Example** | `'seed' => env('CHAOS_SEED', 42)` — same seed produces same chaos behavior every run. |
| **Exceptions** | Exploratory chaos sessions where reproducibility is not required. |
| **Consequences Of Violation** | Unreproducible chaos failures; wasted debugging time on non-reproducible issues. |

## Rule 6: Measure Steady State Before Injecting Chaos
| Field | Value |
|-------|-------|
| **Name** | Measure Steady State Before Injecting Chaos |
| **Category** | Methodology & Rigor |
| **Rule** | Measure normal system behavior (response time, error rate, throughput) before injecting chaos. Compare post-chaos metrics against the steady-state baseline. |
| **Reason** | Without steady-state measurement, you cannot quantify the impact of chaos injection. A 200ms response time during chaos might be acceptable, but if the steady state is 50ms, the 4x degradation is a problem. Steady-state measurement provides context for interpreting chaos results. |
| **Bad Example** | Injecting chaos on payment gateway and observing 500ms response — "that's acceptable" — but steady state is 80ms; 6x degradation. |
| **Good Example** | Measure: "Steady state: 80ms, 0% errors." Inject chaos: "450ms, 0% errors." Analyze: "5.6x latency increase under gateway failure — acceptable." |
| **Exceptions** | Tests that verify specific fallback behavior rather than performance metrics. |
| **Consequences Of Violation** | Misinterpreting chaos results; accepting unacceptable degradation due to lack of baseline context. |
