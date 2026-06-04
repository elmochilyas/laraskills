# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Performance & Load Testing
## Knowledge Unit: LoadForge Cloud Load Testing

---

### Tree 1: LoadForge vs Other Load Testing Tools

```mermaid
flowchart TD
    A[Choose load testing platform] --> B{Need distributed global<br>traffic generation?}
    B -->|Yes| C[Use LoadForge — managed agents in multiple regions]
    B -->|No — local only| D{Test complexity?}
    D -->|Simple endpoint benchmark| E[Use Apache Bench — quick, free, CLI]
    D -->|Complex user flows| F[Use JMeter — full-featured, GUI-based]
    D -->|PHP-native CI assertion| G[Use VoltTest — integrates with PHP tests]
    C --> H{Compliance/air-gap<br>requirements?}
    H -->|Yes — cannot use external| I[Self-managed JMeter cluster]
    H -->|No| J[LoadForge — no infrastructure management]
    A --> K{Budget?}
    K -->|Limited| L[ab + JMeter — free, open source]
    K -->|Can pay for service| M[LoadForge — saves ops overhead]
```

**Key decision points:**
- **Distributed vs local**: LoadForge for multi-region tests. Local tools (ab, JMeter, VoltTest) for single-location testing.
- **Compliance**: If external traffic generation is not allowed, use self-managed JMeter.
- **Budget**: LoadForge costs per test run. Free alternatives (ab, JMeter) work for smaller scale.

---

### Tree 2: Staging vs Production — Where to Test

```mermaid
flowchart TD
    A[Choose target environment] --> B{Primary test<br>target}
    B -->|Staging| C[Recommended — safe, repeatable, isolated]
    B -->|Production| D{Only if absolutely<br>necessary}
    D -->|Yes — coordinated| E[24h ops notice, off-peak hours, rollback plan]
    D -->|No — avoid| F[Never test production without warning]
    C --> G[Production-equivalent hardware and data volume]
    G --> H{Staging matches<br>production specs?}
    H -->|Yes| I[Results are production-representative]
    H -->|No — different hardware| J[Results are directional only — note hardware differences]
    A --> K{Test includes write<br>operations?}
    K -->|Yes| L[Use test database — clean up after test]
    K -->|No — read-only| M[No data cleanup needed]
```

**Key decision points:**
- **Staging by default**: LoadForge tests should target staging. Production testing requires coordination.
- **Hardware parity**: Staging should match production specs for meaningful results.
- **Write operations**: Test data must be cleaned up after write-heavy load tests.

---

### Tree 3: Ramp-Up Strategy — Finding the Breaking Point

```mermaid
flowchart TD
    A[Configure ramp-up] --> B{Test goal?}
    B -->|Find breaking point| C[Gradual ramp: 10 → 20 → 50 → 100 users]
    B -->|Test sustained load| D[Ramp to target quickly, then sustain]
    B -->|Test surge handling| E[Instant full load — simulate flash sale]
    C --> F[Monitor: when error rate >1% or latency spikes → that's the limit]
    F --> G[Breaking point at 65 concurrent users → capacity planning baseline]
    D --> H[Maintain target load for 10+ minutes → check for degradation]
    H --> I[Stable = good. Degrading = memory leak or pool exhaustion]
    A --> J{Test duration?}
    J -->|Minimum 5 minutes| K[10-15 minutes recommended for stable metrics]
    J -->|Soak test| L[30-60 minutes to detect slow degradation]
```

**Key decision points:**
- **Breaking point**: Gradual ramp reveals the exact concurrency level where performance degrades.
- **Sustained load**: Maintain target load to detect memory leaks and connection pool exhaustion.
- **Duration**: 10-15 minutes minimum. Longer for soak testing degradation patterns.

---

### Tree 4: Read vs Write Mix — Matching Production Traffic

```mermaid
flowchart TD
    A[Design traffic mix] --> B{What percentage of<br>production traffic is write?}
    B -->|0-10% writes| C[Test: 90-100% GET, 0-10% POST]
    B -->|10-30% writes| D[Test: 70-90% GET, 10-30% POST/PUT/DELETE]
    B -->|30%+ writes| E[Test: 50-70% GET, 30-50% write operations]
    A --> F{Endpoints with side<br>effects?}
    F -->|Yes — queues, notifications| G[Monitor queue depth during test — may grow unbounded]
    F -->|No — simple CRUD| H[No side effects to monitor]
    A --> I{Authentication<br>required?}
    I -->|Yes| J[Include login in on_start; reuse session cookies]
    I -->|No| K[Simple unauthenticated requests]
```

**Key decision points:**
- **Match production mix**: Write operations have different performance than reads. Weight by production distribution.
- **Side effects**: Queueable jobs triggered by writes may grow unbounded under load. Monitor queue depth.
- **Authentication**: Include login flows in test scripts. Sessions should be reused across requests.
