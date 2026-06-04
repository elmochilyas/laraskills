# Phase 5: Rules — API Usage Tracking

## Rule 1: Never Block the Request Path for Usage Tracking
---
## Category
Performance
---
## Rule
Always emit usage events asynchronously via Redis Stream or equivalent buffer. Never write to the usage database or block the response while tracking usage.
---
## Reason
Synchronous tracking adds latency to every API request. During traffic spikes, it creates backpressure that degrades API response times for all consumers.
---
## Bad Example
```php
public function handle(Request $request, Closure $next) {
    $response = $next($request);
    // Synchronous DB write blocks response
    UsageEvent::create([...]); // adds 50ms to every request
    return $response;
}
```
---
## Good Example
```php
public function handle(Request $request, Closure $next) {
    $response = $next($request);
    // Async — push to buffer and return immediately
    Redis::xadd('usage_events', '*', $eventData);
    return $response;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Added latency on every request; database contention under load; API response times degrade.
---

## Rule 2: Enrich Events at Write Time
---
## Category
Performance
---
## Rule
Always enrich usage events with consumer metadata (tier, company ID, billing plan) at event creation time. Never store raw IDs and join at query time.
---
## Reason
Joining at query time requires database joins across millions of events, making dashboards and billing queries impractically slow.
---
## Bad Example
```php
// Store only foreign keys — requires joins on every query
['consumer_id' => 42]; // query must join consumers table
```
---
## Good Example
```php
// Store denormalized metadata at write time
[
    'consumer_id' => 42,
    'tier' => 'pro',
    'company_id' => 7,
    'billing_plan' => 'monthly',
];
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Dashboard queries take minutes instead of seconds; aggregation jobs timeout; reporting delayed.
---

## Rule 3: Track 100% of Writes, Sample Reads
---
## Category
Scalability
---
## Rule
Always track 100% of mutation requests (POST, PATCH, PUT, DELETE) for billing accuracy. Sample read-only endpoints at 1-10%. Never track reads at the same rate as writes.
---
## Reason
Reads typically outnumber writes 10:1 or more. Tracking all reads at the same detail as writes multiplies storage and processing costs without billing benefit.
---
## Bad Example
```php
// Track all requests at 100% — unnecessary storage cost for reads
if (true) { $this->track($request, $response); }
```
---
## Good Example
```php
$sampleRate = match (true) {
    $request->isMethod('GET') || $request->isMethod('HEAD') => 0.05, // 5%
    default => 1.0, // 100% for mutations
};
if (mt_rand() / mt_getrandmax() < $sampleRate) {
    $this->track($request, $response);
}
```
---
## Exceptions
APIs where read analytics are monetized (data marketplace, analytics APIs) may track 100% of reads.
---
## Consequences Of Violation
10x unnecessary storage costs; processing pipeline overloaded; analytics data dominated by reads.
---

## Rule 4: Set Clear Data Retention Policies
---
## Category
Security
---
## Rule
Always define and enforce data retention limits: 90 days for raw events, 1 year for hourly aggregations, 2 years for daily aggregations. Never retain raw events indefinitely.
---
## Reason
Raw event storage grows linearly with traffic. Without retention limits, storage costs become unsustainable and data management becomes a compliance risk.
---
## Bad Example
```php
// No retention policy — raw events accumulate indefinitely
// 3 years of raw events: terabytes of data, most never queried
```
---
## Good Example
```php
$schedule->call(function () {
    // Delete raw events older than 90 days
    UsageEvent::where('created_at', '<', now()->subDays(90))->delete();
    // Keep hourly aggregations for 1 year, daily for 2 years
})->dailyAt('03:00');
```
---
## Exceptions
Compliance or legal hold requirements may mandate longer retention for specific consumers.
---
## Consequences Of Violation
Unbounded storage costs; slower queries; compliance violations for PII retention.
---

## Rule 5: Provide Consumer-Facing Usage Dashboard
---
## Category
Maintainability
---
## Rule
Always provide consumers with a real-time usage dashboard showing their own request counts, rate limit status, and quota consumption. Never keep usage data visible only to internal teams.
---
## Reason
Consumer self-service visibility reduces support tickets, enables proactive quota management, and improves consumer experience.
---
## Bad Example
```php
// Usage data available only to internal team
// Consumer calls support to ask "how many requests have I made?"
```
---
## Good Example
```php
// Consumer-facing API endpoint
Route::middleware('auth:api')->get('/usage', function (Request $request) {
    return [
        'current_period_requests' => $consumer->usageThisPeriod(),
        'quota_limit' => $consumer->tier->monthly_quota,
        'quota_remaining' => $consumer->quotaRemaining(),
        'rate_limit_remaining' => RateLimiter::remaining($consumer->rateLimitKey()),
    ];
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
High support ticket volume for usage questions; consumers cannot plan capacity; frustration.
---

## Rule 6: Monitor Pipeline Lag
---
## Category
Reliability
---
## Rule
Always monitor the usage tracking pipeline for event lag (time between event creation and storage). Alert if lag exceeds 60 seconds. Never let pipeline lag go undetected.
---
## Reason
Pipeline lag indicates processing bottlenecks or failures. Undetected lag means billing data may be incomplete, dashboards show stale data, and data loss may occur.
---
## Bad Example
```php
// No pipeline monitoring — lag may be hours before anyone notices
```
---
## Good Example
```php
public function monitorLag(): void {
    $latestEvent = Redis::xinfo('stream', 'usage_events');
    $lagSeconds = now()->diffInSeconds($latestEvent['last-generated']);
    if ($lagSeconds > 60) {
        Alert::critical("Usage tracking pipeline lag: {$lagSeconds}s");
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Billing data loss; consumer dashboards display stale data; revenue leakage from untracked usage.
---

## Rule 7: Detect Anomalies from Consumer Baseline
---
## Category
Security
---
## Rule
Always implement automated anomaly detection that alerts when a consumer's usage deviates significantly from their baseline. Never ignore unusual usage patterns.
---
## Reason
Usage anomalies can indicate compromised credentials, misconfigured clients, or abusive traffic — all requiring investigation.
---
## Bad Example
```php
// No anomaly detection — consumer's API key leaked
// Attacker uses key at 10x normal rate; no alert
```
---
## Good Example
```php
public function checkAnomaly(UsageEvent $event): void {
    $baseline = $this->getBaseline($event->consumer_id);
    $zScore = ($event->count - $baseline->mean) / $baseline->stdDev;
    if ($zScore > 3) { // > 3 standard deviations from baseline
        Alert::warning("Usage anomaly: {$event->consumer_id} — {$zScore}x baseline");
    }
}
```
---
## Exceptions
New consumers without established baselines may skip anomaly detection for the first 7 days.
---
## Consequences Of Violation
Undetected API key abuse; billing surprises for consumers; security incidents missed.
