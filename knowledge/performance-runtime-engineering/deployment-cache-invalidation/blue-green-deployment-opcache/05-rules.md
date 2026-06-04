# Rules: Blue-Green Deployment with OpCache

---

### Rule 1: Always Warm Green Fully Before Switching Traffic

**Category:** Reliability

**Rule:** Always run a comprehensive warm-up script that hits all critical endpoints on the green environment and verify 100% OpCache hit rate before routing user traffic to it.

**Reason:** Without pre-warming, first users hitting green will experience 3-5x latency as OpCache compiles files on-demand, negating the purpose of zero-downtime deployment.

**Bad Example:**
```bash
# Switching immediately after starting green
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG --attributes Key=slow_start.duration_seconds,Value=0
```

**Good Example:**
```bash
# Warm all critical endpoints before switching
cachetool opcache:reset --web --web-path=http://green/opcache.php
for url in / /api/health /api/products /api/users; do
    curl -s -o /dev/null http://green$url
done
curl -s http://green/health | grep '"opcache_hit_rate":100'
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG --attributes Key=slow_start.duration_seconds,Value=0
```

**Exceptions:** Single-endpoint applications where the only endpoint is the health check itself.

**Consequences Of Violation:** Production incidents with high latency after every deployment; degraded user experience during the warm-up window.

---

### Rule 2: Never Decommission Blue Immediately After Switching to Green

**Category:** Reliability

**Rule:** Keep the blue environment running in its fully warmed state after switching traffic to green. Only decommission blue when the next deployment begins.

**Reason:** The primary advantage of blue-green deployment is instant rollback with zero warm-up time. Decommissioning blue immediately removes this capability and turns a controlled switch into a risky one-way migration.

**Bad Example:**
```bash
# Switching and immediately tearing down blue
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG
terraform destroy --target=blue-environment
```

**Good Example:**
```bash
# Switch traffic but keep blue running
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG
# Blue remains active as rollback target
# Decommission only when next deployment begins:
# terraform destroy --target=blue-environment  # Only during next cycle
```

**Exceptions:** Cost emergencies where maintaining duplicate infrastructure creates financial risk outweighing rollback benefit.

**Consequences Of Violation:** Rollback requires a cold deployment to the previous version, taking 2-10 minutes during an active incident.

---

### Rule 3: Keep Each Environment's OpCache File Cache Directory Separate

**Category:** Architecture

**Rule:** Configure separate OpCache file cache directories for blue and green environments. Never share or reuse the same file cache path across environments.

**Reason:** OpCache file cache collisions cause undefined behavior — PHP may load compiled code from the wrong environment, leading to class conflicts, fatal errors, or silent data corruption.

**Bad Example:**
```ini
; Both environments use the same path
opcache.file_cache=/var/opcache-cache
```

**Good Example:**
```ini
; Blue environment
opcache.file_cache=/var/opcache-cache/blue
; Green environment
opcache.file_cache=/var/opcache-cache/green
```

**Exceptions:** Single-server blue-green deployments using only shared memory OpCache with no file cache configured.

**Consequences Of Violation:** Intermittent fatal errors, class not found errors, and unpredictable behavior during and after the deployment switch.

---

### Rule 4: Automate the Traffic Switch via Load Balancer API

**Category:** Reliability

**Rule:** Use load balancer APIs or infrastructure-as-code tooling to automate the traffic cutover. Never perform the switch manually through a web console or SSH session.

**Reason:** Manual traffic switching is error-prone under pressure — a wrong click can drop all traffic, route to the wrong target group, or create a partial switch that leaves some users on the old environment.

**Bad Example:**
```bash
# Manual switch via SSH to load balancer
ssh lb-prod "sed -i 's/server blue:9000/server green:9000/' /etc/nginx/conf.d/app.conf"
ssh lb-prod "nginx -s reload"
```

**Good Example:**
```bash
# Automated switch via load balancer API
aws elbv2 modify-target-group-attributes \
    --target-group-arn $GREEN_TG \
    --attributes Key=slow_start.duration_seconds,Value=0
```

**Exceptions:** Non-critical internal tools where a brief manual cutover window is acceptable and documented.

**Consequences Of Violation:** Human error during the critical cutover moment causes traffic loss, partial routing, or prolonged deployment windows.

---

### Rule 5: Ensure All Database Schema Changes Are Backward-Compatible Before Switching

**Category:** Maintainability

**Rule:** Apply only backward-compatible database schema changes before the blue-green switch. Both blue and green environments must work correctly with the same database schema during the transition.

**Reason:** If green introduces a non-backward-compatible schema change and rollback is needed, blue cannot operate with the new schema, making rollback impossible or requiring a separate schema revert.

**Bad Example:**
```sql
-- Deployed together with code that requires this column
ALTER TABLE users DROP COLUMN old_column;
```

**Good Example:**
```sql
-- Additive change deployed in a separate cycle before code
ALTER TABLE users ADD COLUMN new_column VARCHAR(255) NULL;
-- Old code ignores new column, new code uses it
```

**Exceptions:** Greenfield applications with no active traffic during the first deployment.

**Consequences Of Violation:** Rollback becomes impossible without a separate database rollback, turning a 30-second traffic switch into a 30-minute database recovery operation.

---

### Rule 6: Always Verify Green Independently Before It Receives Any Traffic

**Category:** Testing

**Rule:** Test green's health, OpCache hit rate, database connectivity, and all critical endpoints before the traffic switch. Green must be fully functional and self-sufficient without relying on blue's resources.

**Reason:** Green may start with configuration errors, preloading failures, or missing dependencies. If these are only discovered after traffic is routed, the entire user base is impacted.

**Bad Example:**
```bash
# Switch without any independent verification
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG
```

**Good Example:**
```bash
# Independent verification before switch
curl -s http://green/health | grep '"status":"ok"'
curl -s http://green/health | grep '"opcache_hit_rate":100'
curl -s http://green/api/products | head -n 1
# Only then switch
aws elbv2 modify-target-group-attributes --target-group-arn $GREEN_TG
```

**Exceptions:** None — verification is mandatory before every blue-green switch.

**Consequences Of Violation:** Production outage when dysfunctional green receives traffic, requiring emergency rollback and incident response.

---

### Rule 7: Use Dedicated or Isolated Database Connections for Each Environment's Warm-Up

**Category:** Performance

**Rule:** Ensure green's warm-up script uses dedicated database connections that do not interfere with blue's production traffic. Isolate connection pools between environments during the warm-up phase.

**Reason:** Green's warm-up generates database queries for every endpoint hit. If green shares database connections with blue, warm-up queries compete with production traffic, causing latency spikes for active users.

**Bad Example:**
```php
// Both environments use the same database connection pool
'connections' => [
    'mysql' => [
        'host' => env('DB_HOST'),
        'database' => env('DB_DATABASE'),
        'username' => env('DB_USERNAME'),
        'password' => env('DB_PASSWORD'),
    ],
],
```

**Good Example:**
```php
// Green uses a dedicated database user with limited connection count
'connections' => [
    'mysql' => [
        'host' => env('DB_HOST'),
        'database' => env('DB_DATABASE'),
        'username' => env('DB_USERNAME'),  // Read-replica user for warm-up
        'password' => env('DB_PASSWORD'),
        'options' => [
            PDO::ATTR_EMULATE_PREPARES => true,  // Reduce server load during warm-up
        ],
    ],
],
```

**Exceptions:** Read-replica-warmed deployments where warm-up exclusively uses read replicas that do not serve production traffic.

**Consequences Of Violation:** Production latency spikes during the warm-up phase due to connection pool exhaustion or query contention.

---

### Rule 8: Test the Rollback Path Regularly, Not Just the Forward Deployment

**Category:** Testing

**Rule:** Schedule rollback testing for the blue-green deployment process at least once per month. The rollback path must be validated under production-like conditions, not just assumed to work.

**Reason:** The forward deployment path is exercised on every release, but the rollback path is only used during incidents. Without regular testing, the rollback will fail due to configuration drift, credential changes, or infrastructure modifications.

**Bad Example:**
```bash
# Only testing forward deployment
./deploy-green.sh
# Rollback procedure exists in documentation but has never been run
```

**Good Example:**
```bash
# Deploy to green
./deploy-green.sh
# Switch to green
./switch-to-green.sh
# Test rollback in staging immediately
./rollback-to-blue.sh
# Verify blue still serves correctly
curl -s http://blue/health | grep '"status":"ok"'
```

**Exceptions:** None — rollback testing is mandatory for any deployment strategy that claims zero-downtime.

**Consequences Of Violation:** During a real incident, the rollback fails due to untested assumptions, extending the outage from minutes to hours while engineers debug the rollback process.
