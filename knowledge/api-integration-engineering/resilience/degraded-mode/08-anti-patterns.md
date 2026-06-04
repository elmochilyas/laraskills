# ECC Anti-Patterns — Degraded Mode

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Degraded Mode |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Triggering Degraded Mode on Single Failures
2. In-Memory Degraded State in Multi-Server Deployments
3. Exiting Degraded Mode on First Successful Probe
4. No User-Facing Degraded Mode Indicator
5. Degraded Mode Added Post-Production (Never Tested)
6. No Degradation Criteria Definition

## Repository-Wide Anti-Patterns

- God Services
- Silent Failure
- Overengineering

---

## Anti-Pattern 1: Triggering Degraded Mode on Single Failures

### Category
Reliability

### Description
Entering degraded mode on every individual request failure or timeout. The system oscillates between normal and degraded modes constantly.

### Why It Happens
Developers catch exceptions and immediately set the degraded flag. They don't distinguish transient from sustained failures.

### Warning Signs
- `catch (Exception $e) { $this->enterDegradedMode(); }`
- Degraded mode enters and exits multiple times per minute
- Users see degradation banner flashing on and off

### Why It Is Harmful
A single transient timeout (0.1% of requests) triggers degraded mode. All features degrade unnecessarily. Users see the "service degraded" banner for a blip. The system exits degraded mode on the next successful request. Another timeout triggers it again. The UI flashes between normal and degraded states. Users stop trusting the indicator.

### Preferred Alternative
Trigger degraded mode on circuit breaker Open state, not individual failures.

### Refactoring Strategy
1. Remove direct failure-to-degraded mapping
2. Listen to circuit breaker state transitions
3. Enter degraded mode only on circuit Open event

### Related Rules
Trigger Degraded Mode on Circuit Breaker Open, Not Single Failures (05-rules.md)

### Related Skills
Implement Degraded Mode When External Services Are Unavailable (06-skills.md)

### Related Decision Trees
Degraded Mode Trigger Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: In-Memory Degraded State in Multi-Server Deployments

### Category
Scalability | Reliability

### Description
Storing degraded mode flags in a PHP class variable. Each server independently decides whether to degrade.

### Why It Happens
In-memory is the simplest implementation. Developers test on single-server.

### Warning Signs
- `private bool $degraded = false;` on a service class
- Some servers serve degraded, others don't
- Inconsistent user experience across requests

### Why It Is Harmful
Server A enters degraded mode (Stripe circuit open). Server B hasn't detected the failure. Server B continues calling Stripe. Half of users see cached data (degraded), half see timeout errors (calling Stripe directly). Users are confused. Ops can't determine if the system is degraded overall.

### Preferred Alternative
Store degraded mode state in Redis.

### Refactoring Strategy
1. Move degraded flags to Redis `Cache::store('redis')`
2. Set TTL for auto-recovery
3. Check on every request: `Cache::get("degraded:stripe", false)`

### Related Rules
Store Degraded Mode State in Redis (05-rules.md)

---

## Anti-Pattern 3: Exiting Degraded Mode on First Successful Probe

### Category
Reliability

### Description
Exiting degraded mode immediately when a single health check succeeds. Premature exit causes flapping.

### Why It Happens
The health check returns success, so the code sets `degraded = false`. It seems logical.

### Warning Signs
- `if (Http::get('/health')->ok()) { $this->exitDegradedMode(); }`
- Degraded mode enters and exits repeatedly during flaky recovery
- Health check success immediately followed by failure

### Why It Is Harmful
Upstream service recovers briefly (30s), then fails again. The first successful probe exits degraded mode immediately. Full traffic resumes. The upstream fails again under load. Circuit re-opens. Degraded mode re-enters. Users see normal→broken→normal→broken cycling. The flapping causes more disruption than staying degraded.

### Preferred Alternative
Require N consecutive successes before exiting degraded mode.

### Refactoring Strategy
1. Track consecutive success count in cache
2. Only exit after N consecutive successes (e.g., 5)
3. Reset counter on any failure

### Related Rules
Require Consecutive Successes Before Exiting Degraded Mode (05-rules.md)

### Related Decision Trees
Recovery Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: No User-Facing Degraded Mode Indicator

### Category
User Experience | Reliability

### Description
Degrading features silently without showing any indicator to users. Users see missing features as bugs.

### Why It Happens
Developers focus on server-side degradation logic and forget the UI.

### Warning Signs
- Features show empty states or error text during degradation
- No banner, badge, or message indicating degraded mode
- Users filing bug reports for expected degraded behavior

### Why It Is Harmful
Exchange rates stop loading because the rate API is down. The page section is simply empty. Users think the feature is broken. Support team receives 100 tickets about "broken exchange rates." Each ticket requires investigation to determine it's a known upstream issue.

### Preferred Alternative
Display a visible indicator when degraded mode is active.

### Refactoring Strategy
1. Create a Blade component or Vue component for degraded banner
2. Check `IntegrationHealthService::isDegraded()` in views
3. Show message: "Exchange rates temporarily unavailable. Last updated: X"
4. Include last-successful-update timestamp

### Related Rules
Communicate Degraded State to Users (05-rules.md)

---

## Anti-Pattern 5: Degraded Mode Added Post-Production (Never Tested)

### Category
Testing | Reliability

### Description
Adding degraded mode as a post-production fix after an outage. The code exists but was never tested. It fails when needed.

### Why It Happens
"It's added to the sprint backlog" → "It's deployed now" → "We'll test later." Later never comes.

### Warning Signs
- Degraded mode code exists but no test coverage
- No staging test scenarios for degraded mode
- Fallback code executes database queries that aren't indexed

### Why It Is Harmful
Outage hits. Circuit opens. Degraded mode kicks in. The fallback query (`Order::where(...)`) has no index. The query takes 30 seconds. The page times out. Degraded mode is worse than the original failure because untested fallback code is slower than the failed API call.

### Preferred Alternative
Test degraded mode in staging with simulated failures.

### Refactoring Strategy
1. Write integration tests for each degraded mode scenario
2. Simulate upstream failures with HTTP fakes
3. Verify degraded responses are fast and correct

### Related Rules
Test Degraded Mode in Staging with Simulated Failures (05-rules.md)

---

## Anti-Pattern 6: No Degradation Criteria Definition

### Category
Architecture | Maintainability

### Description
No documented definition of which features degrade and which remain critical per service. Developers guess during outages.

### Why It Happens
Degradation logic is written ad-hoc as features are built. No one steps back to define the degradation contract.

### Warning Signs
- `isDegraded()` called but no clear list of affected features
- Critical features sometimes disabled during degradation
- Non-critical features left on (and broken) during degradation

### Why It Is Harmful
Payment API degrades. The developer's code disables the "payment method selector" but keeps the "charge now" button. Users can click "charge now" but can't select a payment method. Confusing error states. No one documented that "charge now" should also be disabled because it depends on the payment API.

### Preferred Alternative
Document per-service degradation criteria with feature-level granularity.

### Refactoring Strategy
1. Create a degradation matrix per service
2. Mark each feature as critical (stay on) or non-critical (disable)
3. Implement `getAvailableFeatures()` returning allowed operations

### Related Rules
Define Clear Degradation Criteria Per Service (05-rules.md)
