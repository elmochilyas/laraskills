# Rules — LoadForge Cloud Load Testing

## Rule 1: Never Load Test Production Without Warning
| Field | Value |
|-------|-------|
| **Name** | Never Load Test Production Without Warning |
| **Category** | Safety & Coordination |
| **Rule** | Always run LoadForge tests against a staging environment. If production testing is necessary, coordinate with operations during off-peak hours with explicit warning and rollback plan. |
| **Reason** | LoadForge generates real HTTP traffic from distributed agents. Production load testing can exhaust resources, trigger auto-scaling, affect real users, and cause downtime. Staging environments exist specifically for this purpose. |
| **Bad Example** | Running a LoadForge test targeting the production URL without warning — production goes down during peak hours. |
| **Good Example** | Testing against `https://staging.example.com`; if production test is required, ops team is notified 24h in advance. |
| **Exceptions** | Production smoke tests with minimal load (1-2 concurrent users) within normal traffic variance. |
| **Consequences Of Violation** | Production outage; degraded user experience; potential data corruption from write operations. |

## Rule 2: Test from Multiple Geographic Regions
| Field | Value |
|-------|-------|
| **Name** | Test from Multiple Geographic Regions |
| **Category** | Coverage & Accuracy |
| **Rule** | Configure LoadForge tests to generate traffic from multiple geographic regions that represent your user distribution. Never test from a single region if your users are global. |
| **Reason** | A user in London connecting to a US-East server has different latency than a user in Sydney. Single-region testing misses geographic performance differences — poor CDN configuration, regional DNS issues, and trans-oceanic latency problems. |
| **Bad Example** | Testing only from US-East for a global application with users in Europe, Asia, and Australia. |
| **Good Example** | Testing from US-East, London, Frankfurt, Sydney, and Tokyo — representing the actual user distribution. |
| **Exceptions** | Applications serving users from a single geographic region only. |
| **Consequences Of Violation** | Geographic performance disparities go undetected; users in some regions have poor experience. |

## Rule 3: Include Write Operations in the Test Mix
| Field | Value |
|-------|-------|
| **Name** | Include Write Operations in the Test Mix |
| **Category** | Coverage & Accuracy |
| **Rule** | Include POST, PUT, DELETE, and PATCH endpoints in load tests. Weight the test mix to match production traffic distribution. Never test only GET endpoints. |
| **Reason** | Write operations have different performance characteristics than reads — database writes, validation, authorization checks, and side effects (queues, notifications). Testing only GET endpoints misses the performance impact of write-heavy operations that may bottleneck the database or queue. |
| **Bad Example** | LoadForge test with 100% GET traffic to `/api/users` — write performance is completely untested. |
| **Good Example** | 70% GET traffic, 20% POST traffic, 10% PUT/DELETE — matching production traffic mix. |
| **Exceptions** | Read-only applications where writes are negligible. |
| **Consequences Of Violation** | Write-heavy operations underperform in production; database bottlenecks during peak traffic. |

## Rule 4: Run Tests for Minimum 10-15 Minutes
| Field | Value |
|-------|-------|
| **Name** | Run Tests for Minimum 10-15 Minutes |
| **Category** | Methodology & Accuracy |
| **Rule** | Configure LoadForge tests to run for at least 10-15 minutes. Never run tests shorter than 5 minutes. |
| **Reason** | Short tests (30-60 seconds) include cold-start effects, cache warming, and request distribution skew. Stable metrics require sustained load over time. Longer tests also reveal degradation patterns — performance that starts well but degrades over minutes due to memory leaks, connection pool exhaustion, or garbage collection. |
| **Bad Example** | 30-second LoadForge test — metrics skewed by cold start; memory leaks invisible. |
| **Good Example** | 10-minute test with gradual ramp-up — stable metrics; leaks and degradations become visible. |
| **Exceptions** | Quick smoke tests to verify load testing infrastructure is configured correctly. |
| **Consequences Of Violation** | Metrics not representative of sustained production load; memory leaks and degradation patterns missed. |

## Rule 5: Use Gradual Ramp-Up, Not Instant Full Load
| Field | Value |
|-------|-------|
| **Name** | Use Gradual Ramp-Up, Not Instant Full Load |
| **Category** | Methodology & Accuracy |
| **Rule** | Configure gradual virtual user ramp-up (e.g., start at 10 users, increase by 10 every minute). Never start with the full concurrent user count. |
| **Reason** | Gradual ramp-up reveals the breaking point — the specific load level where error rate exceeds 1% or latency spikes. Instant full load only tells you whether the application survived, not where the threshold is. Ramp-up also prevents cold-start shocks and provides a more realistic traffic pattern. |
| **Bad Example** | Starting immediately with 100 concurrent users — test shows "survived" or "failed" but no threshold data. |
| **Good Example** | Ramp-up from 10 to 100 users over 10 minutes — identifies that degradation starts at 65 concurrent users. |
| **Exceptions** | Tests designed to measure instant surge handling (e.g., flash sale scenarios). |
| **Consequences Of Violation** | No visibility into the application's breaking point; capacity planning is guesswork. |

## Rule 6: Version-Control Locust Scripts Alongside Application Code
| Field | Value |
|-------|-------|
| **Name** | Version-Control Locust Scripts Alongside Application Code |
| **Category** | Maintenance & Reproducibility |
| **Rule** | Store LoadForge Locust scripts in the application repository, not in LoadForge's cloud storage only. Treat them as production code. |
| **Reason** | Load test scripts define the traffic patterns, user behaviors, and endpoint coverage for performance validation. They evolve with the application. Storing them outside version control means they become stale, unreviewed, and unreproducible. Scripts in the repository are reviewed, versioned, and deployable alongside the application. |
| **Bad Example** | Locust scripts uploaded directly to LoadForge dashboard — no version history; script drift over time. |
| **Good Example** | Locust scripts in `tests/Load/` directory, reviewed in PRs, deployed with the application. |
| **Exceptions** | LoadForge built-in scripts that don't custom user behavior (simple URL-only tests). |
| **Consequences Of Violation** | Stale load tests; no version history; unreproducible performance benchmarks. |
