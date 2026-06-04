# Anti-Patterns: Laravel Horizon Monitoring for Integration Queues

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit | Laravel Horizon Monitoring for Integration Queues |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Single Queue for All Job Types | Architecture | High |
| 2 | No Tag Strategy for Job Filtering | Observability | Medium |
| 3 | Worker Timeout Too Low for API Calls | Reliability | High |
| 4 | Unlimited Snapshot Retention Consuming Redis Memory | Performance | Medium |
| 5 | Horizon Dashboard Accessible Without Authentication | Security | Critical |

---

## Anti-Pattern 1: Single Queue for All Job Types

### Category
Architecture

### Description
Running all job types (application tasks, webhook processing, email dispatch, API integrations) on the default `default` queue without separation, priorities, or dedicated worker pools.

### Why It Happens
One queue is simpler to set up than multiple. Applications start with a single queue, and adding new queues requires configuration changes that are deferred.

### Warning Signs
- All jobs run on the `default` queue
- Webhook processing jobs compete with email jobs for the same workers
- A slow API call in one job blocks all other job types
- No queue priority configuration in `config/horizon.php`
- No per-queue monitoring visibility in Horizon dashboard

### Why Harmful
Without queue isolation, a slow or failing integration job blocks all other processing. A webhook job waiting for a slow API response occupies a worker that could have processed 100 email jobs. Integration failures cascade: a stuck payment webhook blocks account creation jobs, notification emails, and data sync tasks.

### Real-World Consequences
- Payment webhook makes a slow API call to Stripe (30 second timeout)
- Worker is occupied for 30 seconds; all other jobs queue up behind it
- User account creation jobs are delayed by 5 minutes during peak traffic
- Email notifications arrive hours late because webhooks consumed all workers
- Debugging is harder: cannot tell if issues are specific to integration jobs or global queue overload

### Preferred Alternative
Route integration jobs to dedicated queues with separate worker pools. Use at minimum: `webhooks-high` (priority payment webhooks), `webhooks` (standard), `integrations` (API calls), and keep application background tasks on the default queue.

```php
// config/horizon.php
'production' => [
    'webhooks-high' => ['connection' => 'redis', 'queue' => ['webhooks-high']],
    'webhooks' => ['connection' => 'redis', 'queue' => ['webhooks'], 'balance' => 'auto'],
    'integrations' => ['connection' => 'redis', 'queue' => ['integrations']],
    'default' => ['connection' => 'redis', 'queue' => ['default']],
],
```

### Refactoring Strategy
1. Define queue names for each job category (webhooks, integrations, email, default)
2. Configure separate Horizon queue definitions in `config/horizon.php`
3. Update each job class to specify its queue via `public $queue = 'webhooks';`
4. Set worker priorities: high-priority queues get dedicated workers
5. Monitor queue-specific metrics in Horizon dashboard after separation

### Detection Checklist
- [ ] Dedicated queues exist for webhook and integration jobs
- [ ] Application background tasks have a separate queue
- [ ] High-priority webhooks have a dedicated queue with sufficient workers
- [ ] Per-queue monitoring shows distinct health per category
- [ ] Slow integration jobs do not block application tasks

### Related Rules/Skills/Trees
- Rule: Dedicated integration queue for all API jobs
- Rule: Per-service queue isolation for granular monitoring
- Related KU: Queue-first webhook processing

---

## Anti-Pattern 2: No Tag Strategy for Job Filtering

### Category
Observability

### Description
Integration jobs dispatched without Horizon tags, making it impossible to filter, search, or monitor jobs by service name, operation type, or external service.

### Why It Happens
Tags are optional. If developers don't implement the `tags()` method on job classes, Horizon still works — but filtering is limited to job class names.

### Warning Signs
- No integration job has a `tags()` method
- Horizon dashboard shows untagged entries in the job listings
- Filtering by service name (Stripe, Mailgun) is not possible
- Identifying which webhook jobs are for which provider requires opening each job entry
- Debugging integration issues requires grep-ing through all jobs instead of filtering by tag

### Why Harmful
Without tags, Horizon's powerful filtering capability is wasted. When investigating an issue, operators cannot filter to "all Stripe webhook jobs in the last hour." Each job must be inspected individually. For high-volume integrations, this makes debugging impractical — operators can't find the relevant jobs among thousands of untagged entries.

### Real-World Consequences
- Stripe webhook processing errors spike; operator cannot filter to see only Stripe jobs
- 10,000 job entries in Horizon; operator must manually scan each for "stripe" in the class name
- During incident, operator spends 15 minutes finding relevant jobs instead of 30 seconds
- Correlation between service issues (Stripe latency) and job failures is invisible
- Monthly integration health review requires manual data extraction

### Preferred Alternative
Implement `tags()` on every integration job, including service name, operation type, and relevant identifiers.

```php
class ProcessStripeWebhook implements ShouldQueue {
    public function __construct(
        public readonly string $stripeEventId,
        public readonly string $eventType,
    ) {}
    
    public function tags(): array {
        return [
            'stripe',
            "event:{$this->eventType}",
            "stripe_id:{$this->stripeEventId}",
        ];
    }
}
```

### Refactoring Strategy
1. Add `tags()` method to every integration job class
2. Include service name, operation type, and identifier in tags
3. Use consistent tag naming conventions (service prefix, hyphen-separated)
4. Update team documentation to require tags on new integration jobs
5. Create Horizon dashboard bookmarks for common tag filters

### Detection Checklist
- [ ] Every integration job has a `tags()` method
- [ ] Tags include service name and operation type
- [ ] Tag naming conventions are consistent across all jobs
- [ ] Horizon dashboard filtering works per service
- [ ] Code reviews check for missing tags on integration jobs

### Related Rules/Skills/Trees
- Rule: Tag jobs with service name and operation type for dashboard filtering
- Rule: Auto-tags and custom tags for job filtering and monitoring
- Related KU: Laravel Horizon configuration

---

## Anti-Pattern 3: Worker Timeout Too Low for API Calls

### Category
Reliability

### Description
Setting Horizon worker timeouts too low for the expected response time of external API integrations, causing jobs to be killed prematurely.

### Why Happens
Default Horizon worker timeout is 60 seconds. Developers keep this default without analyzing the actual response time distributions of their external API calls.

### Warning Signs
- Horizon shows jobs periodically marked as "timed out"
- `MaxAttemptsExceededException` for jobs that were actually making slow API calls
- API response time documentation shows occasional spikes (p99 > 30s) but timeout is 60s
- Support ticket: "the webhook job failed because of a timeout" — job was timed out by Horizon, not by the API
- No correlation between Horizon worker timeout and HTTP client timeout configuration

### Why Harmful
Horizon's timeout kills the worker process. If the job is making a legitimate but slow API call (which happens: large payloads, overloaded upstream, network congestion), the job is marked as failed even though the API call would have succeeded. This causes unnecessary retries and may permanently fail legitimate requests.

### Real-World Consequences
- Stripe's API occasionally takes 90 seconds for large report downloads
- Horizon worker timeout is 60 seconds; these jobs always timeout
- Each timeout counts as a failed attempt; after 3 attempts, job permanently fails
- Operator manually re-runs the job; it succeeds because Stripe is not slow that time
- Weekly task: manually re-run timed-out webhook jobs

### Preferred Alternative
Set Horizon worker timeout to match or exceed the expected p99.9 response time of the slowest API call the job makes. Coordinate with the HTTP client timeout.

```php
// config/horizon.php — worker timeout matches API p99
'environments' => [
    'production' => [
        'webhooks' => [
            'connection' => 'redis',
            'queue' => ['webhooks'],
            'timeout' => 120, // Matches HTTP client timeout
        ],
    ],
],

// In the job, HTTP client timeout matches or is slightly less than worker timeout
Http::timeout(110)->post(...) // 110s < 120s worker timeout
```

### Refactoring Strategy
1. Measure p99.9 response time for each external API call
2. Set HTTP client timeout to p99.9 + 30s buffer
3. Set Horizon worker timeout to HTTP client timeout + 10s buffer
4. Document timeout values and reasoning per integration
5. Monitor timeout events in Horizon and adjust over time

### Detection Checklist
- [ ] Worker timeout exceeds HTTP client timeout for each integration
- [ ] Worker timeout is based on measured API response time (not default)
- [ ] Horizon timeout events are monitored and investigated
- [ ] Timeout values are documented per integration
- [ ] Slow API calls are not killed by Horizon prematurely

### Related Rules/Skills/Trees
- Rule: Worker timeout (60-120s) based on expected API response times
- Rule: Set worker timeout based on expected API response times
- Related KU: HTTP client timeout configuration

---

## Anti-Pattern 4: Unlimited Snapshot Retention Consuming Redis Memory

### Category
Performance

### Description
Not configuring Horizon snapshot retention, allowing metrics snapshots to accumulate in Redis indefinitely and consuming memory until Redis runs out of memory.

### Why Happens
Horizon snapshots are enabled by default and work without configuration. Developers don't realize they accumulate indefinitely in Redis.

### Warning Signs
- Redis memory usage grows steadily over time
- `horizon:snapshots` key contains millions of entries
- Redis `maxmemory-policy` evicts Horizon data under memory pressure
- Horizon dashboard shows gaps in historical metrics (evicted data)
- Redis memory alert triggers periodically; restarting Horizon temporarily fixes it

### Why Harmful
Redis is an in-memory database with finite capacity. Unlimited snapshot growth eventually exhausts Redis memory, causing eviction of critical data (cache, sessions, queue data) alongside the less-important snapshots. This degrades application performance and may cause data loss.

### Real-World Consequences
- Redis memory reaches 95% capacity after 6 months of snapshot accumulation
- Redis evicts session data under `allkeys-lru` policy; all users logged out
- Cache keys for rate limiters are evicted; rate limiting stops working
- Queue job data is evicted; jobs are lost
- Production incident: "Redis memory exhausted" — Horizon snapshots are the largest consumer
- Fix: flush all snapshots, losing all historical trend data

### Preferred Alternative
Configure snapshot retention explicitly. Set a maximum number of snapshots to retain or a TTL for pruning old snapshots.

```php
// config/horizon.php
'snapshots' => [
    'retention' => 1440, // Keep 1440 snapshots = 24 hours at 1-per-minute
],

// Or use the horizon:snapshot command with retention:
// php artisan horizon:snapshot --retention=1440
```

### Refactoring Strategy
1. Measure current snapshot storage in Redis: `LLEN horizon:snapshots`
2. Configure retention limit: 1440 snapshots (24 hours) or 10080 (7 days)
3. Monitor Redis memory usage after configuring retention
4. Set up Redis memory alert: 70% usage for warning, 85% for critical
5. Document snapshot retention policy and review quarterly

### Detection Checklist
- [ ] Snapshot retention limit is explicitly configured
- [ ] Redis memory usage is stable (growing only with new queue types, not time)
- [ ] Historical trend data is available for at least retention period
- [ ] Redis memory alerting is configured
- [ ] Snapshot eviction does not cause application data loss

### Related Rules/Skills/Trees
- Rule: Snapshot storage: ~100 bytes per snapshot per queue
- Rule: Enable snapshots for historical trending of queue health
- Related KU: Redis memory management for Horizon

---

## Anti-Pattern 5: Horizon Dashboard Accessible Without Authentication

### Category
Security

### Description
Exposing the Horizon dashboard without authentication, allowing anyone with the URL to view queue status, job payloads, and failure details.

### Why Happens
In development, Horizon can be accessed without auth. Teams deploy to production without enabling Horizon's authorization gates, assuming the URL is secret enough.

### Warning Signs
- `Horizon::auth()` is not configured in `AppServiceProvider`
- No middleware protecting the `/horizon` route
- Horizon dashboard is accessible without login on production
- Job payloads (which may contain user data, API keys, PII) are publicly visible
- Security scan flags exposed Horizon dashboard

### Why Harmful
Horizon dashboard shows detailed job information including payloads, exception messages, and stack traces. This may include PII (user email, customer data), API credentials, internal IP addresses, and database query details. An attacker with Horizon access can extract sensitive data and understand application internals.

### Real-World Consequences
- Security researcher discovers unprotected Horizon dashboard on production
- Job payloads contain user email addresses and payment amounts (PII exposure)
- Exception stack traces reveal internal server paths and database structure
- Queue management features allow attacker to purge all pending jobs (denial of service)
- Compliance violation: GDPR data exposure from visible PII in job payloads

### Preferred Alternative
Configure Horizon authorization to restrict dashboard access to authorized users only. Use Laravel's built-in authorization gates.

```php
// AppServiceProvider.php
protected function gate(): void {
    Gate::define('viewHorizon', function ($user) {
        return in_array($user->email, [
            'ops@example.com',
            'devops@example.com',
        ]);
    });
}

// Or restrict by environment
Horizon::auth(function ($request) {
    return app()->environment('local') 
        || auth()->user()?->hasRole('admin');
});
```

### Refactoring Strategy
1. Implement `Horizon::auth()` gate in service provider
2. Define authorized users (ops team, senior developers)
3. Add middleware to `/horizon` route if additional protection needed
4. Remove any `.env` configuration that disables auth in production
5. Verify unauthorized access returns 403

### Detection Checklist
- [ ] Horizon dashboard requires authentication in production
- [ ] Authorization gate is configured (not relying on URL secrecy)
- [ ] Only authorized users have dashboard access
- [ ] Dashboard is not exposed on public internet without auth
- [ ] Security testing confirms unauthorized 403

### Related Rules/Skills/Trees
- Rule: Secure Horizon dashboard behind authentication (Horizon gates)
- Rule: Restrict access to integration queue monitoring to ops team
- Related KU: Laravel authorization gates
