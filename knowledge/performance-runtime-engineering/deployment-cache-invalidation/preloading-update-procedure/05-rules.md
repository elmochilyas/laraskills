# Rules: Preloading Update Procedure

---

### Rule 1: Always Use Full PHP-FPM Restart When Preloading Changes

**Category:** Architecture

**Rule:** When the preloading script or any preloaded class file changes, execute a full PHP-FPM restart (`systemctl stop && systemctl start`). Never use graceful reload (SIGUSR2) for preloading changes.

**Reason:** Preloading executes during php_module_startup(), which only runs when the master process starts. Graceful reload spawns new workers from the existing master state without re-executing the preload script. Preloaded classes flagged as GC_IMMUTABLE survive opcache_reset() and remain in memory until the process terminates.

**Bad Example:**
```bash
# Reload does not refresh preloading
systemctl reload php8.3-fpm
# Preloaded classes are still the old versions
```

**Good Example:**
```bash
# Full restart re-executes the preload script
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
```

**Exceptions:** None — there is no alternative mechanism to refresh preloaded classes without process termination.

**Consequences Of Violation:** Preloaded classes remain unchanged despite code deployment, causing the application to execute stale class definitions silently.

---

### Rule 2: Drain the Instance from the Load Balancer Before Full Restart

**Category:** Reliability

**Rule:** Before performing a full PHP-FPM restart for preloading updates, signal the load balancer to stop sending new connections to the instance. Wait for in-flight requests to complete before restarting.

**Reason:** Full restart terminates all workers immediately, dropping any in-flight requests. Draining first ensures all active requests complete naturally, preventing user-facing errors (502 Bad Gateway, connection resets) during the restart window.

**Bad Example:**
```bash
# Restart without draining — drops in-flight requests
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
```

**Good Example:**
```bash
# Drain, then restart, then rejoin
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30  # Wait for in-flight requests to complete
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
sleep 3
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
```

**Exceptions:** Single-server deployments with no load balancer where brief downtime is acceptable.

**Consequences Of Violation:** Active users experience connection drops and 502 errors during the restart window, creating a negative user experience.

---

### Rule 3: Verify Preloading State After Every Full Restart

**Category:** Testing

**Rule:** After restarting PHP-FPM for preloading changes, call `opcache_get_status(false)['preload_statistics']` to confirm that preloading executed correctly. Never assume the restart succeeded without verification.

**Reason:** A bad preload script can prevent PHP-FPM from starting, or preloading may partially fail with only some classes loaded. Without verification, a silent preloading failure goes undetected until runtime when un-preloaded classes cause slow performance.

**Bad Example:**
```bash
systemctl start php8.3-fpm
echo "PHP-FPM started"
# No preloading verification
```

**Good Example:**
```bash
systemctl start php8.3-fpm
sleep 2
# Verify preloading
php -r '
    $status = opcache_get_status(false);
    $preload = $status["preload_statistics"] ?? null;
    if (!$preload || empty($preload["functions"])) {
        echo "Preloading failed or no classes loaded\n";
        exit(1);
    }
    echo "Preloaded " . count($preload["functions"]) . " functions successfully\n";
'
```

**Exceptions:** None — preloading verification is mandatory after every full restart.

**Consequences Of Violation:** Silent preloading failure means the application runs without preloading benefits, degrading performance until the next maintenance window.

---

### Rule 4: Minimize Preloading Changes to Reduce Full Restart Frequency

**Category:** Maintainability

**Rule:** Batch preloading script updates into larger, less frequent releases. Only change the preloading configuration when necessary, and group multiple preloading changes into the same deployment.

**Reason:** Each preloading change requires a full PHP-FPM restart with load balancer drain. Frequent preloading changes increase the risk of failed restarts, extend maintenance windows, and cause repeated OpCache cold-start cycles.

**Bad Example:**
```bash
# Week 1: Preloading change → full restart
# Week 2: Another preloading change → full restart
# Week 3: Third preloading change → full restart
```

**Good Example:**
```bash
# Collect preloading changes for a single release
# Week 3: Three preloading changes → one full restart
```

**Exceptions:** Security patches that require immediate class definition changes.

**Consequences Of Violation:** Unnecessary operational risk and downtime from frequent full restarts, with each restart carrying a small but non-zero risk of failure.

---

### Rule 5: Test Preloading Changes in Staging Before Production Restart

**Category:** Testing

**Rule:** Apply all preloading changes to a staging environment first and verify PHP-FPM starts successfully with the new preload script. Only proceed to production restart after staging validation passes.

**Reason:** A bad preload script prevents PHP-FPM from starting entirely. If discovered in production during a restart, the service remains down while the team diagnoses and fixes the issue. Staging testing catches this before production impact.

**Bad Example:**
```bash
# Deploying preloading directly to production
ssh production "systemctl restart php8.3-fpm"
# If preload fails, production is down
```

**Good Example:**
```bash
# Test in staging first
ssh staging "systemctl restart php8.3-fpm"
ssh staging "php -r 'var_dump(opcache_get_status(false)[\"preload_statistics\"]);'"
# Only then deploy to production
ssh production "systemctl restart php8.3-fpm"
```

**Exceptions:** None — preloading changes must always be tested in an environment that mirrors production.

**Consequences Of Violation:** Production downtime from a bad preload script, requiring emergency rollback procedures and potentially causing extended service unavailability.

---

### Rule 6: Include Preloading Refresh in the Rollback Plan

**Category:** Reliability

**Rule:** The rollback procedure must explicitly include a full PHP-FPM restart to refresh preloaded classes. Never assume that rolling back code files is sufficient to restore previous preloaded class behavior.

**Reason:** Preloaded classes are loaded at startup and cached in the master process until termination. Rolling back code files without a full restart leaves old preloaded classes in memory, creating a mismatch between the rolled-back source code and the preloaded bytecode.

**Bad Example:**
```bash
# Rollback: only reverting code files
rsync -a --delete /app/releases/previous/ /app/current/
# No restart — preloading still from the rolled-forward version
```

**Good Example:**
```bash
# Complete rollback with preloading refresh
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30
rsync -a --delete /app/releases/previous/ /app/current/
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
sleep 3
php -r 'print_r(opcache_get_status(false)["preload_statistics"]);'
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
```

**Exceptions:** Deployments where no preloaded files changed, and only non-preloaded code was modified.

**Consequences Of Violation:** After rollback, the application still executes preloaded bytecode from the problematic deployment, potentially maintaining the very bug or security issue the rollback was meant to fix.
