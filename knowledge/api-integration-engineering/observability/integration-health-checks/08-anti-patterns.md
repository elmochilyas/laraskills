# Anti-Patterns: Integration Health Checks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit | Integration Health Checks |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Making Full Business API Calls in Health Checks | Performance | High |
| 2 | Not Caching Health Check Results | Performance | Medium |
| 3 | Alerting on Every Transient Failure | Operations | High |
| 4 | Single Location Health Checks | Reliability | Medium |
| 5 | No Consecutive Failure Threshold | Operations | High |

---

## Anti-Pattern 1: Making Full Business API Calls in Health Checks

### Category
Performance

### Description
Using the same API calls as business operations in health checks (creating resources, fetching large datasets, performing complex queries) instead of lightweight ping/pong endpoints.

### Why It Happens
Developers use the existing API client code for health checks, since it's already implemented. They call the same endpoints used in production, assuming a working business call is the best health indicator.

### Warning Signs
- Health check creates test resources (test charges, test emails) on the upstream API
- Health check fetches the same list endpoint used for production (large response, slow)
- Health check takes more than 2 seconds to complete (calling heavy endpoints)
- API provider rate limits health checks alongside production traffic
- Provider support tickets: "your health checks are creating test resources in our system"

### Why Harmful
Full business API calls in health checks create unnecessary load on upstream APIs, potentially creating test resources that incur costs or require cleanup. They take longer than necessary, slowing the health check endpoint response. They consume rate limit budgets that should be used for production traffic.

### Real-World Consequences
- Stripe health check creates a test charge every 30 seconds; Stripe flags the account for unusual activity
- Mailgun health check sends a test email every minute; monthly email count inflated by 43,200 test emails
- Health check fetches the order list endpoint (500ms, heavy response); health endpoint takes 3+ seconds
- Upstream API rate limits are partially consumed by health checks; production requests are rate-limited

### Preferred Alternative
Use lightweight ping/pong endpoints for health checks: simple connectivity and auth verification.

```php
class StripeHealthCheck implements HealthCheckInterface {
    public function check(): HealthResult {
        $start = microtime(true);
        
        // Lightweight: GET a single resource, limit=1
        $response = Http::withToken($this->apiKey)
            ->timeout(5)
            ->get('https://api.stripe.com/v1/charges', ['limit' => 1]);
        
        $duration = (microtime(true) - $start) * 1000;
        
        if ($response->successful()) {
            return HealthResult::healthy(duration: $duration);
        }
        
        return HealthResult::unhealthy(
            error: 'Stripe API returned ' . $response->status(),
            duration: $duration,
        );
    }
}
```

### Refactoring Strategy
1. Audit all existing health checks for expensive API calls
2. Replace with lightweight endpoints: `GET /v1/charges?limit=1` (Stripe), token introspection endpoints, or provider health endpoints
3. Set health check timeout to 5 seconds (much shorter than business call timeouts)
4. Verify health check duration is under 500ms for most providers
5. Document health check endpoints per provider

### Detection Checklist
- [ ] Health checks use lightweight endpoints (ping/pong, not business operations)
- [ ] Health checks do not create test resources
- [ ] Health check duration is under 500ms (ideally under 200ms)
- [ ] Health check timeout is 5 seconds (not matching business call timeouts)
- [ ] Health checks do not consume significant rate limit budget

### Related Rules/Skills/Trees
- Rule: Implement ping/pong check: call a lightweight endpoint
- Rule: Making full business API calls in health checks
- Related KU: API rate limiting (rate limit headroom for health checks)

---

## Anti-Pattern 2: Not Caching Health Check Results

### Category
Performance

### Description
Running health checks on every request to the health endpoint without caching, so that multiple concurrent or sequential requests all trigger separate health check executions.

### Why Happens
Health checks are simple function calls. Developers call them directly in the health endpoint controller without considering that multiple requests (load balancer probes, monitoring tools, dashboards) will all trigger expensive upstream API calls.

### Warning Signs
- Health endpoint calls upstream APIs on every request
- Monitoring tool polls `/health` every 10 seconds; each poll triggers 5 API calls (one per integration)
- Load balancer health probes from multiple nodes all trigger separate health checks
- Upstream API rate limits are hit during health monitoring surges
- Health check results vary between requests due to cache absence

### Why Harmful
Without caching, N concurrent health check requests cause N calls to every upstream API. A simple dashboard refresh triggers 10+ API calls. During incidents (when health checks are looked at most), the health endpoint load multiplies as multiple operators refresh the dashboard simultaneously.

### Real-World Consequences
- Monitoring system polls `/health` from 3 nodes every 15 seconds
- Each poll calls 6 integration health checks (Stripe, Mailgun, Slack, etc.)
- That's 18 API calls every 15 seconds = 72 per minute = 4,320 per hour
- Upstream API rate limits (Stripe: 100 req/s) partially consumed by health monitoring
- Development team triples the number of integrations; health check traffic overwhelms rate limits

### Preferred Alternative
Cache health check results with a short TTL (30-60 seconds). Return cached results for requests within the TTL.

```php
class HealthController extends Controller {
    public function __invoke(): JsonResponse {
        $results = Cache::remember('health:all', 30, function () {
            return collect(config('integrations'))
                ->map(fn ($config, $name) => [
                    'name' => $name,
                    'status' => app($config['health_check'])->check()->toArray(),
                ]);
        });
        
        return response()->json($results);
    }
}
```

### Refactoring Strategy
1. Add cache layer to health check dispatching
2. Set cache TTL to 30-60 seconds (acceptable staleness for health data)
3. Use cache tags per integration for targeted invalidation if needed
4. Monitor cache hit rate for health checks
5. Ensure cache invalidation on manual health check trigger

### Detection Checklist
- [ ] Health check results are cached with TTL
- [ ] Cache TTL is 30-60 seconds
- [ ] Multiple requests within TTL do not trigger upstream API calls
- [ ] Cache hit rate for health checks is high (>90%)
- [ ] Stale health data (within TTL) is acceptable for operational decisions

### Related Rules/Skills/Trees
- Rule: Cache health check results for 30-60s
- Rule: Cache results to prevent thundering herd on dashboard page load
- Related KU: Laravel caching for API responses

---

## Anti-Pattern 3: Alerting on Every Transient Failure

### Category
Operations

### Description
Triggering alerts on every health check failure without distinguishing between transient failures (network blip, temporary rate limit, upstream blip) and persistent failures (auth expiry, provider outage).

### Why It Happens
Health check failure = bad. The simplest alerting is: if health check returns unhealthy, fire alert. Developers don't add transient failure filtering.

### Warning Signs
- Alert fires every time any health check fails, even once
- "Health check failed" alerts during normal operations (transient blips)
- Operations team develops alert fatigue; starts ignoring health check alerts
- Health check failures autocorrect within seconds but alerts require manual acknowledgment
- PagerDuty shows 50+ health check alerts per day, most self-resolving

### Why Harmful
Alert fatigue is dangerous: when a real incident occurs, operators may dismiss the alert as "another transient blip." Each false alert wastes operator attention and erodes trust in the monitoring system.

### Real-World Consequences
- Stripe API returns one 503 per day (transient); health check alerts every time
- Operations team receives 7 alerts/week from transient failures
- After 3 weeks, operators start dismissing health check alerts without checking
- Real Stripe API outage occurs; health check alerts are ignored for 20 minutes
- Incident duration increases because of delayed response to genuine alert

### Preferred Alternative
Use consecutive failure thresholds: only alert when health check fails N consecutive times. Transient failures are absorbed; persistent failures trigger alerts.

```php
class HealthCheckAlerting {
    public function evaluate(string $integration, HealthResult $result): void {
        $failures = Cache::increment("health:failure_count:{$integration}");
        
        if ($result->isHealthy()) {
            Cache::forget("health:failure_count:{$integration}");
            return;
        }
        
        if ($failures >= config("health.alert_threshold.{$integration}", 3)) {
            Notification::alert("health.{$integration}.unhealthy", [
                'integration' => $integration,
                'consecutive_failures' => $failures,
                'error' => $result->error,
            ]);
        }
    }
}
```

### Refactoring Strategy
1. Implement consecutive failure counter per integration health check
2. Set threshold: 3 consecutive failures before alerting
3. Reset counter on success
4. Document thresholds per integration (critical integrations may use lower threshold)
5. Monitor alert volume reduction after threshold implementation

### Detection Checklist
- [ ] Consecutive failure threshold is configured for each integration
- [ ] Transient single failures do not trigger alerts
- [ ] Counters reset on success
- [ ] Alert volume decreased significantly after implementation
- [ ] Operations team confirms alert fatigue has reduced

### Related Rules/Skills/Trees
- Rule: Alert on health check failure with escalation based on duration
- Rule: Validate connectivity and auth separately
- Related KU: Incident response for integration failures

---

## Anti-Pattern 4: Single Location Health Checks

### Category
Reliability

### Description
Running health checks from a single server or region, missing network-level failures that affect only specific paths to the upstream API.

### Why Happens
Health checks are typically implemented as an endpoint on the application server. Monitoring runs from the same location, so network issues between redundant data centers or CDN edge locations are invisible.

### Warning Signs
- Health checks run only from the application's primary server
- Multi-region deployments use the same health check source
- Health checks indicate "healthy" but users in another region report integration failures
- Network path issues between secondary data center and upstream API go undetected
- Health check only tests connectivity from one internal network

### Why Harmful
A single-location health check may report the integration as healthy when the network path from another region or data center is failing. During a regional network outage, the health check shows green while customers in the affected region experience integration failures.

### Real-World Consequences
- Primary US-East server health check shows Stripe as healthy
- European users are routed to EU servers; network route from EU to Stripe API has packet loss
- European customers cannot process payments for 3 hours
- Health check shows green the entire time; operations team not alerted
- Issue discovered only when customer support receives complaints from European users

### Preferred Alternative
Run health checks from multiple locations: each server/region checks its own connectivity. Aggregate results to provide per-region and overall health.

```php
class MultiRegionHealthCheck {
    public function check(): array {
        $results = [];
        
        // Health check from each region
        foreach (config('health.regions') as $region) {
            $results[$region] = Cache::remember(
                "health:{$region}",
                30,
                fn () => $this->checkFromRegion($region),
            );
        }
        
        return $results;
    }
    
    private function checkFromRegion(string $region): array {
        // This runs on the server in that region
        return collect(config('integrations'))
            ->map(fn ($config, $name) => [
                'name' => $name,
                'region' => $region,
                'status' => app($config['health_check'])->check()->toArray(),
            ]);
    }
}
```

### Refactoring Strategy
1. Deploy health check machinery to each server/region
2. Implement per-region health check execution
3. Store per-region results in a shared cache with region prefix
4. Create aggregate health endpoint showing per-region status
5. Alert on any region reporting unhealthy

### Detection Checklist
- [ ] Health checks run from each server/region
- [ ] Health check results are stored per-region
- [ ] Aggregate health endpoint shows per-region status
- [ ] Regional health check failure triggers alert
- [ ] Global health check passing but one region failing is visible in dashboard

### Related Rules/Skills/Trees
- Rule: Checking health from a single location may not reflect all server regions
- Rule: Implement separate checks for connectivity and auth
- Related KU: Multi-region deployment health monitoring

---

## Anti-Pattern 5: No Consecutive Failure Threshold

### Category
Operations

### Description
Not configuring a consecutive failure threshold for health check alerts, causing an alert to fire on every single failure and creating alert fatigue.

### Why Happens
Developers set up health check alerting to fire immediately on any failure, assuming any failure is always a real problem. They don't anticipate transient network blips.

### Warning Signs
- Alert fires every time a health check returns unhealthy, even if the next check succeeds
- Operators manually create rules to "snooze" health check alerts after seeing too many false positives
- No `consecutive_failures` or `failure_threshold` configuration exists
- Alert monitoring tool shows high alert-to-incident ratio (many alerts, few incidents)
- Team discusses disabling health check alerts entirely

### Why Harmful
Without consecutive failure threshold, the alerting system generates excessive noise from transient failures. This is a fundamental operations anti-pattern that erodes trust in monitoring and leads to real incidents being missed.

### Real-World Consequences
- Mailgun API occasionally returns 503 for <1 second during load balancing
- Health check catches this every time; alerts fire multiple times per day
- Operations team marks alerts as "noise" after 2 weeks
- Mailgun API has a real outage (down for 30 minutes); health check alerts are ignored
- Customer-facing email sending is down for 30 minutes before anyone notices

### Preferred Alternative
Configure consecutive failure threshold: only treat the integration as unhealthy after N consecutive check failures.

```php
// config/health.php
return [
    'thresholds' => [
        'stripe' => ['consecutive_failures' => 3],
        'mailgun' => ['consecutive_failures' => 5], // More transient
        'payment_gateway' => ['consecutive_failures' => 2], // Critical
    ],
];

// Alerting service
$failureCount = Cache::increment("health:failure:{$integration}");
if ($failureCount >= $threshold) {
    // Fire alert
}
// On success: Cache::forget("health:failure:{$integration}");
```

### Refactoring Strategy
1. Add consecutive failure counter to health check pipeline
2. Define per-integration thresholds (critical: 2, standard: 3, best-effort: 5)
3. Reset counter on successful health check
4. Monitor alert volume before and after threshold implementation
5. Document threshold values and rationale per integration

### Detection Checklist
- [ ] Consecutive failure threshold is configured and enforced
- [ ] Per-integration thresholds are defined based on criticality
- [ ] Counter resets on successful check
- [ ] Alert volume is stable and actionable
- [ ] Transient failures do not trigger alerts

### Related Rules/Skills/Trees
- Rule: Alert on health check failure with escalation based on duration
- Rule: Validate connectivity and auth separately
- Related KU: Operations alerting best practices
