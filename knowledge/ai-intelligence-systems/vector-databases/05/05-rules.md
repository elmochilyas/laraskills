## Provision Enough RAM for the Index

---
## Category
Performance | Scalability

---
## Rule
Provision enough RAM to fit the entire vector index in memory; never run a vector database with the index on disk for production workloads.

---
## Reason
ANN indexes perform 10-100x faster from RAM than from disk. An index on disk causes each search to trigger multiple disk reads, destroying latency targets. HNSW requires 2-4x the raw vector size in RAM.

---
## Bad Example
```php
// Deploying on a server with 4GB RAM for a 1M vector HNSW index
// Raw: 1M × 1536 × 4 = ~6GB, HNSW: ~18GB RAM needed — OOM
```

---
## Good Example
```php
class CapacityPlanner {
    public function plan(int $vectorCount, int $dimensions, string $indexType): array {
        $vectorBytes = $vectorCount * $dimensions * 4; // float32
        $memoryMultiplier = match($indexType) {
            'hnsw' => 3.0,
            'ivf' => 1.2,
            'ivf_pq' => 0.5,
        };
        $requiredRAM = $vectorBytes * $memoryMultiplier;
        return [
            'required_ram' => $requiredRAM,
            'recommended_nodes' => $requiredRAM > 32e9 ? 2 : 1,
        ];
    }
}

$plan = $planner->plan(vectorCount: 1_000_000, dimensions: 1536, indexType: 'hnsw');
// required_ram ~= 18GB — need a node with ≥24GB RAM
```

---
## Exceptions
Batch-processing systems where sub-second latency is not required may use disk-based indexes.

---
## Consequences Of Violation
10-100x slower searches, swap thrashing, database OOM crashes, inability to meet latency SLAs.

---

## Use Dedicated Instances for Vector DB

---
## Category
Performance

---
## Rule
Deploy the vector database on dedicated instances (not shared with the application server); never run a vector DB on the same server as the web application.

---
## Reason
Vector databases are CPU, memory, and I/O intensive. Running them alongside the application causes resource contention — the application steals RAM from the index, and search queries compete for CPU with HTTP requests.

---
## Bad Example
```php
// Application + vector DB on same 8GB server
// Application uses 4GB, vector index needs 6GB — both suffer
```

---
## Good Example
```php
// docker-compose.yml
services:
  app:
    image: laravel-app
    deploy:
      resources:
        limits: { memory: 4G }
  qdrant:
    image: qdrant/qdrant
    deploy:
      resources:
        limits: { memory: 16G } # Dedicated RAM for index
    volumes:
      - qdrant_data:/qdrant/storage
```

---
## Exceptions
pgvector running inside PostgreSQL may share the database server but needs dedicated memory allocation for the index.

---
## Consequences Of Violation
Resource contention, unpredictable performance, both application and search degraded, hard to diagnose root cause.

---

## Implement a Query Cache

---
## Category
Performance

---
## Rule
Cache frequent vector search queries in Redis or similar; never let every query hit the vector database when 20-40% are repeats.

---
## Reason
Vector search involves embedding generation (50-200ms) and ANN search (5-50ms). A cache eliminates both costs for repeated queries, reducing p95 latency and API costs.

---
## Bad Example
```php
public function search(string $query): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search($vector, 10);
    // Every query hits the vector DB — no caching
}
```

---
## Good Example
```php
public function search(string $query): array {
    $cacheKey = 'vector_search:' . md5($query);
    return Cache::remember($cacheKey, 60, function () use ($query) {
        $vector = $this->embedder->embed($query);
        return $this->vectorStore->search($vector, 10);
    });
}
```

---
## Exceptions
Real-time search requiring up-to-the-second results (breaking news, live inventory) should bypass cache.

---
## Consequences Of Violation
Unnecessary vector DB load, higher latency for repeat queries, lower QPS capacity, higher embedding API costs.

---

## Monitor Query Latency Percentiles

---
## Category
Observability

---
## Rule
Track p50, p95, and p99 query latency and set alerts for degradation; never rely on average latency alone.

---
## Reason
Average latency hides tail latency problems. A few slow queries can make p99 unacceptable while p50 looks fine. Monitoring percentiles reveals issues with index quality, resource contention, or problematic queries.

---
## Bad Example
```php
$avgLatency = array_sum($latencies) / count($latencies);
Log::info('Avg search latency', ['ms' => $avgLatency]);
// Hides p99=2000ms while p50=20ms
```

---
## Good Example
```php
class SearchMetrics {
    public function record(array $latencies): void {
        sort($latencies);
        $count = count($latencies);

        Metrics::gauge('search_latency_p50', $latencies[(int)($count * 0.50)]);
        Metrics::gauge('search_latency_p95', $latencies[(int)($count * 0.95)]);
        Metrics::gauge('search_latency_p99', $latencies[(int)($count * 0.99)]);
        Metrics::gauge('search_qps', $count);

        $p99 = $latencies[(int)($count * 0.99)];
        if ($p99 > 200) { // Alert if p99 > 200ms
            Alert::send("Search latency degraded: p99={$p99}ms");
        }
    }
}
```

---
## Exceptions
Development environments may omit detailed percentile monitoring.

---
## Consequences Of Violation
Silent tail-latency degradation, undetected performance issues, SLA violations discovered by users.

---

## Plan for Data Growth

---
## Category
Scalability

---
## Rule
Plan vector database capacity for 6-12 months of data growth; never provision only for current dataset size.

---
## Reason
Vector storage grows linearly with data. A 1M vector index today may be 10M next year. Under-provisioning forces emergency migrations, downtime, or expensive last-minute scaling. Proactive planning ensures smooth growth.

---
## Bad Example
```php
// Provisioned for 100K vectors, now at 500K — performance degraded
// Emergency migration needed
```

---
## Good Example
```php
class GrowthPlan {
    public function estimate(int $currentVectors, int $monthlyGrowth, int $months = 12): array {
        $projectedVectors = $currentVectors + ($monthlyGrowth * $months);
        return [
            'current' => $currentVectors,
            'projected' => $projectedVectors,
            'needed_ram_gb' => $projectedVectors * 1536 * 4 * 3 / 1e9, // HNSW
            'recommended_action' => $projectedVectors > 1_000_000
                ? 'Plan for sharding'
                : 'Single node sufficient',
        ];
    }
}
```

---
## Exceptions
Short-lived projects or prototypes with a defined end date may skip growth planning.

---
## Consequences Of Violation
Emergency infrastructure changes, performance degradation at scale, migration downtime, unexpected cloud costs.
