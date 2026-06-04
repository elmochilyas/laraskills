# Rules — CI Test Execution

## Rule 1: Always Profile Before Optimizing Tests
| Field | Value |
|-------|-------|
| **Name** | Always Profile Before Optimizing Tests |
| **Category** | Performance & Methodology |
| **Rule** | Use `php artisan test --profile` to identify the slowest tests before spending time on optimization. Never optimize without profiling data. |
| **Reason** | Teams often guess which tests are slow and optimize the wrong ones. Profiling reveals the actual 20% of tests consuming 80% of test suite time. Without profiling, optimization effort is misdirected and delivers minimal impact. |
| **Bad Example** | "Let's optimize the user factory — it must be slow" — profiling shows the actual bottleneck is a single integration test with an external API call. |
| **Good Example** | Run `--profile`, identify top 5 slowest tests: "54% of suite time is 3 tests — optimizing these has the highest impact." |
| **Exceptions** | Test suites under 50 tests where profiling noise exceeds signal. |
| **Consequences Of Violation** | Optimization effort wasted on low-impact tests; actual bottlenecks remain. |

## Rule 2: Profile Warm Runs for Optimization Targets
| Field | Value |
|-------|-------|
| **Name** | Profile Warm Runs for Optimization Targets |
| **Category** | Performance & Accuracy |
| **Rule** | Run profiling on warm CI runs (with cached vendor, config, routes, and views). Never optimize based on cold-run profile data. |
| **Reason** | Cold runs include cache warming overhead (config loading, route registration, service provider booting) that inflates all test timings uniformly. Warm runs reflect realistic CI performance and reveal the actual tests that are slow regardless of framework boot overhead. |
| **Bad Example** | Profiling on cold run — every test is inflated by 200ms of framework boot time; the slowest test appears to be one that's actually fast relative to boot overhead. |
| **Good Example** | Profiling on warm run (config:cache, route:cache, view:cache executed first) — test timing reflects actual execution, not framework boot. |
| **Exceptions** | Tests specifically designed to measure cold-start performance (serverless applications). |
| **Consequences Of Violation** | Optimization targets misidentified; time wasted on framework boot overhead rather than actual test logic. |

## Rule 3: Use JUnit XML for CI Trend Tracking
| Field | Value |
|-------|-------|
| **Name** | Use JUnit XML for CI Trend Tracking |
| **Category** | Observability & Monitoring |
| **Rule** | Output test results in JUnit XML format and upload as CI artifacts. Use CI platform parsing to track per-test timing trends over time. |
| **Reason** | JUnit XML includes per-test timing data. CI platforms (GitHub Actions, GitLab CI) parse JUnit XML for trend dashboards. Tracking p95 test time over weeks reveals degradation patterns before they become critical. A test that creeps from 100ms to 500ms over 3 months signals a problem. |
| **Bad Example** | CI output: "100 tests passed" — no timing data; no trend visibility; steady degradation goes unnoticed. |
| **Good Example** | `--format=junit > test-results.xml` uploaded as artifact; CI shows "test p95 time increased from 300ms to 450ms this month." |
| **Exceptions** | Projects without CI platform JUnit parsing support. |
| **Consequences Of Violation** | Steady test suite time degradation goes unnoticed; reactive (not preventive) performance management. |

## Rule 4: Implement Slow Test Quarantine
| Field | Value |
|-------|-------|
| **Name** | Implement Slow Test Quarantine |
| **Category** | CI & Performance |
| **Rule** | Isolate tests exceeding a time threshold (e.g., 500ms default) into a separate CI job. The main suite runs fast; slow tests don't block PRs. |
| **Reason** | A few slow tests can dominate CI time. A 5-second test in a 1-minute suite is 8% of timing from one test. Quarantining slow tests keeps the main suite fast while still running slow tests (in a separate job, potentially nightly). This prevents slow tests from degrading developer feedback. |
| **Bad Example** | A 30-second test lives in the main test suite — every CI run is delayed by 30 seconds for one test. |
| **Good Example** | Fast tests: `--exclude-group=slow` (1 minute). Slow test job: `--group=slow` (30 seconds, runs in background). |
| **Exceptions** | Projects where all tests are under 500ms and no quarantine threshold is needed. |
| **Consequences Of Violation** | Slow tests degrade CI performance for the entire suite; team tolerates slow feedback. |

## Rule 5: Combine `--profile` with `--parallel` for Distribution Insights
| Field | Value |
|-------|-------|
| **Name** | Combine `--profile` with `--parallel` for Distribution Insights |
| **Category** | Performance & Parallelization |
| **Rule** | Profile tests while running in parallel mode. Look for test files that take significantly longer than others (distribution imbalance). |
| **Reason** | Parallel execution is only as fast as the slowest worker. A single test file taking 30 seconds while others take 10 seconds causes all workers to wait for the slow file. Profiling in parallel mode reveals distribution imbalances that can be fixed by splitting large test files. |
| **Bad Example** | 4 parallel workers: 3 finish in 10 seconds, 1 finishes in 35 seconds — 3.5x slowdown from one unbalanced file. |
| **Good Example** | Profile reveals `UserTest.php` takes 35 seconds — split into `UserAuthenticationTest.php`, `UserProfileTest.php`, `UserAdminTest.php` for balanced distribution. |
| **Exceptions** | Test suites under 5 minutes where distribution imbalance has negligible impact. |
| **Consequences Of Violation** | Underutilized parallel capacity; slower-than-necessary CI. |

## Rule 6: Set a Test Suite Time Budget
| Field | Value |
|-------|-------|
| **Name** | Set a Test Suite Time Budget |
| **Category** | CI & Governance |
| **Rule** | Establish a time budget for the test suite (e.g., "must complete in under 10 minutes"). Monitor p95 time weekly. Alert when budget is exceeded. |
| **Reason** | Without a budget, test suite time grows indefinitely. A 5-minute suite can become 30 minutes over a year as tests accumulate. A budget forces teams to optimize, split, or remove tests proactively rather than reactively when CI becomes unbearably slow. |
| **Bad Example** | "Our CI takes 45 minutes? We should optimize" — reactive response after suite has already degraded. |
| **Good Example** | "Budget is 10 minutes. We're at 8 minutes. P95 trend is +2% per month. Action: split the 3 slowest test files." |
| **Exceptions** | Projects where test suite time is constrained by external factors beyond the team's control. |
| **Consequences Of Violation** | Gradual CI degradation unnoticed until it's critically slow; reactive, painful optimization. |
