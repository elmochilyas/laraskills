# Decision Trees: Laravel Octane Deployment

## Octane Adoption Decision

**Does the application need > 1000 req/s throughput?**
- Yes → Strong candidate for Octane
- No → Evaluate whether Octane complexity is justified

**Is the codebase free of static state and blocking I/O?**
- Yes → Low-risk Octane adoption
- No → Audit and refactor before Octane; cost of remediation may outweigh benefits

**Is the team experienced with long-running PHP processes?**
- Yes → Octane is safe
- No → Start with Octane on low-traffic routes before full adoption

## Runtime Selection

**Deployment preference:**
- Single binary, automatic HTTPS → Choose FrankenPHP
- Mature ecosystem, Go-based → Choose RoadRunner
- Maximum performance, C extension → Choose Swoole

**Need zero-downtime built-in?**
- Yes → FrankenPHP is the official recommendation
- No → Any runtime is acceptable

**Need Mercure hub integration?**
- Yes → FrankenPHP includes Mercure natively
- No → Any runtime works

## Worker Count Calculation

**CPU cores available:**
- 2 cores → 4 workers
- 4 cores → 8 workers
- 8 cores → 16 workers
- 16+ cores → 24-32 workers (diminishing returns above 32)

**Memory concern?**
- Low memory (< 2GB) → Reduce worker count; each worker adds ~100MB RSS
- Adequate memory → Use standard formula (2-4x cores)
