# Rule Card: K072 — Custom Pulse Recorders

---

## Rule 1

**Rule Name:** use-simple-recorders-for-custom-metrics

**Category:** Prefer

**Rule:** Prefer creating simple Pulse recorders for custom queue metrics.

**Reason:** Pulse recorders are lightweight (one class, one config entry) — no external dependencies.

**Bad Example:**
```php
// Custom Prometheus exporter — full library, deployment, infrastructure
$registry->getOrRegisterGauge('queue', 'failed_jobs')->set($count);
```

**Good Example:**
```php
use Laravel\Pulse\Recorders\Concerns;
use Laravel\Pulse\Recorders\Recorder;

class FailedJobRecorder extends Recorder
{
    public function record(Carbon $now): void
    {
        $count = DB::table('failed_jobs')->count();
        $this->remember('failed_jobs', $now, $count);
    }
}
```

**Exceptions:** Advanced metrics that need external system integration.

**Consequences Of ViolATION:** The team spends 2 days setting up a Grafana/Prometheus stack with custom exporters — the same metrics could have been in Pulse in 30 minutes with 20 lines of code.

---

## Rule 2

**Rule Name:** keep-recorder-records-lightweight

**Category:** Always

**Rule:** Always keep the `record()` method fast — under 10ms.

**Reason:** Pulse recorders run on every request by default — slow recorders degrade page load times.

**Bad Example:**
```php
public function record(Carbon $now): void
{
    $orders = Order::with('items', 'payments', 'history')->get(); // Heavy query — 200ms
    $this->remember('total_revenue', $now, $orders->sum('total'));
}
```

**Good Example:**
```php
public function record(Carbon $now): void
{
    $revenue = DB::table('orders')->whereDate('created_at', today())->sum('total'); // Lightweight
    $this->remember('total_revenue', $now, $revenue);
}
```

**Exceptions:** Recorders configured to run on a cron schedule instead of every request.

**Consequences Of ViolATION:** The custom recorder joins 5 tables on every page load — a busy site with 100 requests/second adds 20 seconds of query time per second, overwhelming the database.

---

## Rule 3

**Rule Name:** name-recorders-descriptively

**Category:** Always

**Rule:** Always name Pulse recorder keys descriptively.

**Reason:** Pulse dashboard shows metric names directly — unclear names cause confusion.

**Bad Example:**
```php
$this->remember('q', $now, $count); // "q" — meaningless in dashboard
```

**Good Example:**
```php
$this->remember('queue:failed_jobs_count', $now, $count); // Clear
$this->remember('queue:avg_wait_time_seconds', $now, $avg);
```

**Exceptions:** None — descriptive names always improve dashboard usability.

**Consequences Of ViolATION:** A new operator sees "q" and "x" in the Pulse dashboard — they have to read the recorder code to understand what the metrics mean, wasting time during incident response.

---

## Rule 4

**Rule Name:** avoid-recording-on-every-request

**Category:** Prefer

**Rule:** Prefer recording on a sampling basis for high-frequency metrics.

**Reason:** Writing Pulse entries on every request adds write overhead for metrics that don't change between requests.

**Bad Example:**
```php
// Record failed jobs count on every request — count rarely changes
$this->remember('failed_jobs', $now, $count);
```

**Good Example:**
```php
// Use Pulse's sampling configuration
// config/pulse.php
'recorders' => [
    FailedJobRecorder::class => [
        'sample_rate' => 0.1, // Record on 10% of requests
    ],
],
```

**Exceptions:** Metrics that change with every request (e.g., request latency).

**Consequences Of ViolATION:** The "failed jobs count" metric is written 10,000 times/day — the value changes only once per hour. 99.99% of writes are redundant, consuming Redis memory and write bandwidth for no information gain.
