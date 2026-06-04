## Always Pre-Aggregate Metrics Before Broadcasting
---
## Architecture
---
Always aggregate metrics over time windows before broadcasting to dashboards; never broadcast individual events.
---
Broadcasting every individual metric change overwhelms the broadcast system with millions of tiny events. Clients also cannot meaningfully render every data point — they need summarized metrics.
---
```php
// Broadcasting each request — 1000+ broadcasts/second
broadcast(new RequestProcessed($request));
```
---
```php
// Aggregate over 5-second window
$metrics = ['avg_latency' => ..., 'count' => ..., 'p95' => ...];
broadcast(new DashboardMetricsUpdated($metrics)); // 1 broadcast/5s
```
---
Audit log streaming where individual events are meaningful to display. No common exceptions.
---
Broadcast system overload; unreadable dashboard; wasted resources.

## Always Use Timer-Based Metric Dispatch
---
## Design
---
Always dispatch dashboard metric updates on a timer (e.g., every 5 seconds) rather than on every state change.
---
State-change-based dispatching creates bursty broadcast patterns and inconsistent update intervals. Timer-based dispatch produces predictable, throttled updates.
---
```php
// On every state change — bursty and unpredictable
public function updated() { broadcast(new Metrics($this->data)); }
```
---
```php
// Timer-based — predictable interval
while (true) {
    broadcast(new DashboardMetricsUpdated(collectMetrics()));
    sleep(5);
}
```
---
Event-driven dashboards that must react instantly to specific state changes. No common exceptions.
---
Bursty broadcast load; unpredictable update intervals.

## Always Implement Client-Side Data Windowing
---
## Performance
---
Always maintain a rolling window of data points on the client, discarding old entries to prevent memory growth.
---
Accumulating chart data over hours or days causes browser memory exhaustion. Without windowing, dashboards become sluggish and eventually crash.
---
```javascript
Echo.private(`dashboard.${teamId}`)
    .listen('MetricsUpdated', (event) => {
        data.push(event);
        if (data.length > 100) data.shift(); // Keep last 100 points
    });
```
---
```javascript
// No windowing — memory grows unbounded
Echo.private(`dashboard.${teamId}`).listen('MetricsUpdated', (event) => data.push(event));
```
---
Dashboards with very short sessions. No common exceptions for long-running dashboards.
---
Browser memory exhaustion; sluggish rendering; tab crashes.

## Always Separate Metric Collection from HTTP Request Lifecycle
---
## Architecture
---
Always decouple metric collection from HTTP requests using queues or daemons, not inline collection.
---
Inline metric collection adds latency to HTTP responses and skews the metrics themselves (the collection overhead is included in the measurement).
---
```php
// Measuring request latency including collection overhead
public function handle() {
    $start = microtime(true);
    // ... request handling ...
    Metric::record('latency', microtime(true) - $start); // Skewed
}
```
---
```php
// Dedicated daemon for metric collection
$schedule->command('metrics:collect')->everySecond();
// Command reads from counters, not inline in requests
```
---
Development environments where metric accuracy is not critical. No common exceptions.
---
Skewed metrics; degraded HTTP response times.

## Always Use Private Channels for Dashboard Data
---
## Security
---
Always use private (or presence) channels for dashboard broadcasting — never public channels.
---
Dashboard metrics often contain sensitive operational data (error rates, user counts, financial metrics). Public channels expose this data to any connected client.
---
```php
return [new Channel('dashboard.metrics')]; // Public — anyone can see system metrics
```
---
```php
return [new PrivateChannel('dashboard.team.' . $this->team->id)]; // Scoped access
```
---
Public-facing performance pages (e.g., status.example.com). No common exceptions.
---
Sensitive data exposure; competitive intelligence leakage.

## Always Implement Graceful Degradation When Backend Is Unavailable
---
## Design
---
Always design dashboards to show stale data (with a freshness indicator) when the broadcast backend is unavailable.
---
Without graceful degradation, users see loading spinners or blank charts when the WebSocket disconnects, even though the data source is still operational.
---
```javascript
// Blank state on disconnect — poor UX
Echo.private('dashboard.1').listen('Update', (e) => render(e));
```
---
```javascript
// Show last known data with staleness indicator
Echo.private('dashboard.1').listen('Update', (e) => render(e));
connectionStatus.value === 'disconnected' && showStaleBanner();
```
---
No common exceptions; dashboards should always show data when available.
---
Blank dashboards; unnecessary support tickets; poor user trust.
