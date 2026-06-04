# Rules: Laravel Octane Deployment

## OCTANE-001: octane:reload for Deployments
**Condition:** Application running Laravel Octane
**Action:** Use `php artisan octane:reload` in deployment script, not PHP-FPM restart
**Rationale:** Octane workers maintain in-memory state; PHP-FPM restart kills active requests
**Consequences:** Violation causes production downtime during deployment

## OCTANE-002: Static State Audit Required
**Condition:** Migrating existing Laravel application to Octane
**Action:** Audit all static properties, global state, and service container singletons for cross-request state accumulation
**Rationale:** Octane maintains application in memory; static state persists across requests
**Consequences:** Violation causes data leakage between user requests

## OCTANE-003: Worker Recycling Configuration
**Condition:** Octane production configuration
**Action:** Set `max_requests` (500-1000) and `max_request_time` (30-60s) in config/octane.php
**Rationale:** Prevents memory leak accumulation and stuck request accumulation
**Consequences:** Violation leads to worker OOM crashes over time

## OCTANE-004: CPU-Based Worker Count
**Condition:** Configuring Octane worker pool size
**Action:** Set worker count to 2-4 times CPU core count
**Rationale:** Octane workers are CPU-bound, not memory-bound
**Consequences:** Violation causes CPU oversubscription or underutilization

## OCTANE-005: No Blocking I/O in Request Cycle
**Condition:** Request lifecycle code running under Octane
**Action:** Offload blocking operations (HTTP calls, file I/O, sleep) to queues
**Rationale:** Blocking the Octane worker blocks all subsequent requests on that worker
**Consequences:** Violation causes application-wide latency spikes

## OCTANE-006: Environment Variable Consistency
**Condition:** Changing environment variables for Octane application
**Action:** Full Octane restart required (not just reload) for env changes to take effect
**Rationale:** Env vars are read at process startup, not on each request
**Consequences:** Violation means env changes are silently ignored
