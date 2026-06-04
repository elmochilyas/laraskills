# Skills: HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs

## Skill: Selecting the Right ClickHouse Driver
**Purpose:** Choose the optimal ClickHouse driver for a Laravel analytics workload.
**When to use:** Initial ClickHouse integration or performance optimization.
**Steps:**
1. Measure baseline query performance with HTTP driver
2. Benchmark queries at expected production throughput
3. If latency is acceptable and throughput targets met, keep HTTP
4. If HTTP is a measured bottleneck, evaluate TCP driver
5. Benchmark TCP driver with same workload
6. Document performance comparison
7. Deploy chosen driver with appropriate configuration

## Skill: Configuring HTTP ClickHouse Driver
**Purpose:** Configure the HTTP-based ClickHouse driver for production use.
**When to use:** Initial setup of Laravel + ClickHouse analytics pipeline.
**Steps:**
1. Install `laravel-clickhouse/laravel-clickhouse` package
2. Configure ClickHouse connection in `config/clickhouse.php`
3. Enable HTTP keep-alive for persistent connections
4. Set connection pool size and timeout
5. Configure query retry strategy
6. Add environment-specific ClickHouse configurations
7. Test connection and query execution
8. Monitor connection metrics in production
