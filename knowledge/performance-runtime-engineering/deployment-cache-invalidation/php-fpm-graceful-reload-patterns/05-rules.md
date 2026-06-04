# Rules: PHP-FPM Graceful Reload Patterns

---

### Rule 1: Always Use Reload (SIGUSR2) Instead of Restart (SIGTERM) for Zero-Downtime Deployments

**Category:** Reliability

**Rule:** Use `systemctl reload php8.x-fpm` or `kill -USR2 <master_pid>` for production deployments. Never use `systemctl restart` unless the application requires immediate process termination.

**Reason:** Reload (SIGUSR2) forks new workers and lets old workers complete in-flight requests before exiting — zero dropped connections. Restart (SIGTERM) terminates all workers immediately, dropping active requests and causing 502 errors for users.

**Bad Example:**
```bash
# Drops all in-flight connections
systemctl restart php8.3-fpm
```

**Good Example:**
```bash
# Zero-downtime — old workers drain while new workers accept connections
systemctl reload php8.3-fpm
```

**Exceptions:** Emergency security patches where immediate termination is required to prevent exploit of a critical vulnerability.

**Consequences Of Violation:** Active users receive 502 Bad Gateway errors during every deployment, causing data loss from interrupted requests and eroding trust in the application.

---

### Rule 2: Set process_control_timeout to Prevent Hanging Reloads

**Category:** Reliability

**Rule:** Configure `process_control_timeout = 30-60s` in the PHP-FPM pool configuration. Never leave it at the default value of 0.

**Reason:** With process_control_timeout=0 (default), the master process waits indefinitely for old workers to finish. A worker stuck on a long-running request or persistent connection prevents the reload from completing, leaving the pool in an intermediate state with no new workers spawned.

**Bad Example:**
```ini
; Default — waits forever for workers to finish
; process_control_timeout = 0
```

**Good Example:**
```ini
; Reload completes within 30 seconds maximum
process_control_timeout = 30s
```

**Exceptions:** None — every production PHP-FPM pool should set a reasonable process_control_timeout.

**Consequences Of Violation:** Reload hangs indefinitely due to persistent connections or long-running requests, leaving the pool in an unknown state and requiring manual intervention to force-kill the master.

---

### Rule 3: Always Warm OpCache After Reload Before Declaring the Deployment Complete

**Category:** Performance

**Rule:** After executing a graceful reload, run a comprehensive warm-up script that hits all critical endpoints. Do not consider the deployment complete until OpCache is populated.

**Reason:** Graceful reload spawns new workers with empty OpCache. These workers compile PHP files on demand, causing 3-5 second response times for the first requests they handle. Pre-warming ensures users never experience cold-start latency.

**Bad Example:**
```bash
systemctl reload php8.3-fpm
# Deployment marked complete — OpCache is cold
```

**Good Example:**
```bash
systemctl reload php8.3-fpm
sleep 3
for url in / /api/health /api/products /api/users; do
    curl -s -o /dev/null http://localhost$url
done
curl -s http://localhost/health | grep '"opcache_hit_rate":95'
# Deployment complete — OpCache is warm
```

**Exceptions:** None — OpCache warm-up after reload is mandatory for production deployments.

**Consequences Of Violation:** Users experience slow responses after every deployment, creating a perception of application instability and degrading the user experience.

---

### Rule 4: Never Rely on Reload to Refresh Preloading — Use Full Restart Instead

**Category:** Architecture

**Rule:** When the preloading script or any preloaded class files change, use a full PHP-FPM restart (`systemctl restart`) rather than a graceful reload. Preloading changes cannot be applied via reload.

**Reason:** Preloading runs during php_module_startup(), which only happens when the master process starts. Graceful reload (SIGUSR2) does not re-execute the preload script — it only spawns new workers from the existing master state. Preloaded classes persist in the master process.

**Bad Example:**
```bash
# Reload does NOT refresh preloading
systemctl reload php8.3-fpm
# Preloaded classes are still the old versions
```

**Good Example:**
```bash
# Full restart needed for preloading changes
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
```

**Exceptions:** Deployments where no preloaded files changed and only non-preloaded application files were updated.

**Consequences Of Violation:** Preloaded classes remain unchanged even after deployment, causing silent behavior differences between what developers expect and what the application actually executes.

---

### Rule 5: Monitor Listen Queue During Reload and Alert on Unusual Buildup

**Category:** Maintainability

**Rule:** During the reload window, monitor the PHP-FPM listen queue length. Alert if the queue exceeds a configured threshold (typically 1-2x the pm.max_children count) during reloads.

**Reason:** During reload, old workers drain and new workers start. If new workers are slow to start or the drain takes too long, the listen queue builds up, causing request queuing delays and potential timeouts. Early detection prevents user-facing degradation.

**Bad Example:**
```bash
# No monitoring during reload
systemctl reload php8.3-fpm
echo "Reload initiated — assuming success"
```

**Good Example:**
```bash
systemctl reload php8.3-fpm
# Monitor listen queue during reload window
for i in $(seq 1 30); do
    queue=$(curl -s http://localhost/status?json | python -c "import sys, json; print(json.load(sys.stdin).get('listen queue', 0))")
    if [ "$queue" -gt 10 ]; then
        echo "WARNING: Listen queue at $queue during reload"
    fi
    sleep 1
done
```

**Exceptions:** Single-worker pools where listen queue behavior is predictable and well-understood.

**Consequences Of Violation:** Unnoticed listen queue buildup during reload causes request timeouts for users, making the deployment appear successful while users experience errors.

---

### Rule 6: Batch Configuration Changes to Minimize Reload Frequency

**Category:** Maintainability

**Rule:** Collect multiple PHP-FPM configuration changes and apply them in a single reload rather than reloading for each individual change.

**Reason:** Each reload spawns new workers with empty OpCache, requiring a full warm-up cycle. Frequent reloads cause repeated OpCache cold starts, increasing CPU usage during warm-up and extending the window of mixed old/new workers.

**Bad Example:**
```bash
# Three separate reloads for three changes
systemctl reload php8.3-fpm  # Change pm.max_children
systemctl reload php8.3-fpm  # Change request_terminate_timeout
systemctl reload php8.3-fpm  # Change memory_limit
```

**Good Example:**
```bash
# Single reload with all changes applied
# Edit all three settings in php.ini, then:
systemctl reload php8.3-fpm
# One warm-up cycle needed
```

**Exceptions:** Emergency configuration changes that must take effect immediately to prevent service degradation.

**Consequences Of Violation:** Unnecessary CPU overhead from repeated warm-up cycles, and prolonged windows where different workers have different configurations.
