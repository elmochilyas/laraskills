# Anti-Patterns: Laravel Octane Deployment

## AP-OCTANE-001: PHP-FPM Deployment Script on Octane
**Description:** Using the same deployment script from PHP-FPM for Octane, including `php-fpm restart` or `service php8.x-fpm reload`.
**Why it happens:** Copying existing deployment scripts without adapting to Octane's architecture.
**Consequences:** Restarting PHP-FPM while running Octane does nothing to Octane workers. The deployment appears successful, but old code continues serving through Octane.
**Remediation:** Use `php artisan octane:reload` exclusively for Octane deployments.

## AP-OCTANE-002: Octane Without Memory Monitoring
**Description:** Deploying Octane without monitoring per-worker memory consumption.
**Why it happens:** Teams assume Octane workers self-manage memory like PHP-FPM processes.
**Consequences:** Gradual memory leaks in workers go undetected until OOM killer terminates the entire Octane process, causing full application outage.
**Remediation:** Monitor worker RSS with alerts at 80% threshold. Configure max_requests for automatic worker recycling.

## AP-OCTANE-003: Octane-Only Deployment
**Description:** Deploying Octane to production without maintaining PHP-FPM as a fallback.
**Why it happens:** Full commitment to Octane without contingency planning.
**Consequences:** If Octane crashes or a memory leak is deployed, there is no fallback serving path. Entire application goes down until Octane is fixed.
**Remediation:** Maintain a PHP-FPM backup serving path during the first 3 months of Octane production operation. Remove once Octane stability is proven.

## AP-OCTANE-004: The Blocking Service Call
**Description:** Making synchronous HTTP calls to external APIs inside the Octane request lifecycle without timeouts or circuit breakers.
**Why it happens:** Synchronous code is simpler than async queue-based patterns.
**Consequences:** A slow external API blocks the entire Octane worker, queuing all other requests behind it. p99 latency spikes from 50ms to 30s.
**Remediation:** Offload external API calls to queues with async response handling. Use HTTP client with aggressive timeouts as interim measure.
