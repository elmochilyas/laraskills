---
## Rule Name
Monitor P95 Latency, Not Just Average

## Category
Performance

## Rule
Always monitor P95 latency for search queries, not just average latency.

## Reason
Average latency hides tail latency problems. A system with 20ms average but 500ms P95 delivers poor user experience for 5% of queries.

## Bad Example
```php
// Average only — hides tail latency
$avgLatency = array_sum($latencies) / count($latencies);
```

## Good Example
```php
sort($latencies);
$p95 = $latencies[(int)(count($latencies) * 0.95)];
$p99 = $latencies[(int)(count($latencies) * 0.99)];
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected tail latency degradation that affects user experience.

---
## Rule Name
Set Latency SLOs with Alerts

## Category
Reliability

## Rule
Always define latency SLOs (e.g., P95 < 200ms) and configure alerts for breaches.

## Reason
Without SLOs and alerts, search latency degrades silently until users complain.

## Bad Example
```bash
# No SLOs — latency could be 2s without anyone noticing
```

## Good Example
```php
// Laravel Telescope or custom health check
public function searchHealth(): array
{
    return [
        'p95_latency' => $p95,
        'health' => $p95 < 200 ? 'healthy' : 'degraded',
    ];
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent performance degradation reaching users without detection.

---
## Rule Name
Monitor Index Lag

## Category
Reliability

## Rule
Always monitor index lag — the time between database write and search index availability.

## Reason
High index lag means users search against stale data. This is often overlooked but critically impacts consistency.

## Bad Example
```bash
# Index lag unmonitored — may be hours without detection
```

## Good Example
```php
$maxUpdatedAt = Product::max('updated_at');
$searchUpdatedAt = Product::search('')->orderBy('updated_at', 'desc')->first()?->updated_at;
$indexLag = $maxUpdatedAt->diffInMinutes($searchUpdatedAt);
if ($indexLag > 15) {
    Log::warning("Search index lag: $indexLag minutes");
}
```

## Exceptions
Applications where eventual consistency is acceptable.

## Consequences Of Violation
Users searching against stale data without anyone noticing the delay.
