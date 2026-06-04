# Rules: Zero-Downtime Deployment with OpCache

---

### Rule 1: Always Drain from the Load Balancer Before Touching PHP-FPM

**Category:** Reliability

**Rule:** Before any PHP-FPM reload, restart, or code deployment operation, signal the load balancer to stop sending new connections. Wait for in-flight requests to complete before making any server-side changes.

**Reason:** Any operation that affects PHP-FPM workers (reload, restart, code copy) can disrupt active requests. Draining first ensures all in-flight requests complete normally, and new requests go to other instances. This prevents 502 errors and connection resets for active users.

**Bad Example:**
```bash
# Reloading without draining — drops in-flight requests
systemctl reload php8.3-fpm
```

**Good Example:**
```bash
# Drain before any server operation
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30  # Drain timeout matching max request duration
systemctl reload php8.3-fpm
```

**Exceptions:** Single-server deployments with no load balancer — zero-downtime is not possible in this architecture.

**Consequences Of Violation:** Active users experience interrupted requests and 502 errors during every deployment, causing data loss and eroding trust.

---

### Rule 2: Warm OpCache Before Re-Enabling Traffic After Deployment

**Category:** Performance

**Rule:** After code deployment and PHP-FPM reload, run a comprehensive warm-up script hitting all critical endpoints. Only re-enable traffic after confirming OpCache hit rate exceeds 95%.

**Reason:** New PHP-FPM workers start with empty OpCache. Without warm-up, the first requests handled by new workers compile PHP files on demand, causing 3-5 second response times. Pre-warming eliminates this cold-start latency entirely.

**Bad Example:**
```bash
# Re-enabling traffic immediately after reload
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30
systemctl reload php8.3-fpm
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
# OpCache is cold — first users experience slow responses
```

**Good Example:**
```bash
# Warm before re-enabling
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30
systemctl reload php8.3-fpm
sleep 3
for url in / /api/health /api/products /api/users; do
    curl -s -o /dev/null http://localhost$url
done
curl -s http://localhost/health | grep '"opcache_hit_rate":95'
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
```

**Exceptions:** Endpoints with zero-cache requirements where every request must compile fresh.

**Consequences Of Violation:** Users experience slow response times immediately after every deployment, negating the zero-downtime benefit.

---

### Rule 3: Design the Health Check to Verify OpCache Hit Rate, Not Just HTTP 200

**Category:** Reliability

**Rule:** The health check endpoint must return a non-200 status until OpCache hit rate exceeds 95%. The load balancer should only route traffic to instances that pass this comprehensive health check.

**Reason:** A PHP-FPM instance can return HTTP 200 with a fully functional application but completely cold OpCache. The load balancer would mark it healthy and route traffic, causing users to experience poor performance. Health checks must guard quality of service, not just availability.

**Bad Example:**
```php
// Health check that only verifies PHP is running
http_response_code(200);
echo json_encode(['status' => 'ok']);
```

**Good Example:**
```php
// Health check that verifies OpCache is warm
$opcacheStatus = opcache_get_status(false);
$hitRate = $opcacheStatus['hit_rate'] ?? 0;
if ($hitRate < 95) {
    http_response_code(503);
    echo json_encode(['status' => 'warming', 'opcache_hit_rate' => $hitRate]);
    exit;
}
http_response_code(200);
echo json_encode(['status' => 'ok', 'opcache_hit_rate' => $hitRate]);
```

**Exceptions:** None — OpCache hit rate must be part of every production health check.

**Consequences Of Violation:** Instances with cold OpCache are marked healthy and serve traffic, causing inconsistent performance where some user requests are fast and others are 3-5x slower.

---

### Rule 4: Stagger Warm-Up Across the Fleet to Avoid Thundering Herd

**Category:** Performance

**Rule:** When warming multiple instances after a deployment, stagger the warm-up start times by 5-10 seconds per instance. Never start warm-up on all instances simultaneously.

**Reason:** Warm-up scripts generate database queries, Redis lookups, and API calls for every endpoint hit. If all instances warm simultaneously, backend services see a thundering herd of identical requests, potentially overwhelming databases, caches, and upstream services.

**Bad Example:**
```bash
# All instances warm simultaneously
for host in web1 web2 web3; do
    for url in / /api/health; do
        curl -s -o /dev/null http://$host$url &
    done
done
wait
```

**Good Example:**
```bash
# Stagger warm-ups by 10 seconds per instance
for host in web1 web2 web3; do
    (for url in / /api/health /api/products; do
        curl -s -o /dev/null http://$host$url
    done) &
    sleep 10
done
wait
```

**Exceptions:** Applications with caching layers (Redis, Memcached) that absorb repeated requests and prevent backend overload.

**Consequences Of Violation:** Database or backend service degradation during deployment rollouts, potentially causing a self-inflicted outage while trying to deploy zero-downtime.

---

### Rule 5: Ensure Database Schema Changes Are Backward-Compatible for Rolling Deployments

**Category:** Maintainability

**Rule:** All database schema changes must be backward-compatible with the previous code version. Deploy schema changes in a separate step before the code that depends on them.

**Reason:** In rolling zero-downtime deployments, old and new workers coexist. Old workers continue serving with the new schema. If the schema change breaks backward compatibility, old workers crash, causing partial service outage during the deployment window.

**Bad Example:**
```sql
-- Applied in the same deployment step as code
ALTER TABLE users DROP COLUMN old_email;
-- Old workers crash trying to reference old_email
```

**Good Example:**
```sql
-- Applied in a separate, earlier deployment
ALTER TABLE users ADD COLUMN new_email VARCHAR(255) NULL;
-- Old workers continue using 'old_email', new workers use 'new_email'
-- Old 'email' column is dropped in a later release after all workers are updated
```

**Exceptions:** Blue-green deployments where the entire environment switches atomically — no mixed-version window exists.

**Consequences Of Violation:** Old workers crash with database errors during rolling deployments, reducing service capacity and potentially causing a partial outage.

---

### Rule 6: Monitor Error Rates and Latency During the Entire Deployment Window

**Category:** Maintainability

**Rule:** Track error rate, p95 latency, and listen queue length throughout the zero-downtime deployment process. Set alert thresholds that trigger immediate investigation or automated rollback if metrics deviate from baseline.

**Reason:** Zero-downtime deployments can fail in subtle ways — a missing warm-up, a misconfigured health check, a slow worker start. Without real-time monitoring during deployment, these failures go undetected until user complaints surface.

**Bad Example:**
```bash
# Deploy without monitoring
./deploy-zero-downtime.sh
echo "Deployment complete"
```

**Good Example:**
```bash
# Deploy with monitoring
./deploy-zero-downtime.sh &
DEPLOY_PID=$!
# Monitor during deployment
for i in $(seq 1 60); do
    error_rate=$(curl -s http://localhost/metrics | grep 'http_errors_total' | cut -d' ' -f2)
    p95=$(curl -s http://localhost/metrics | grep 'http_request_duration_seconds_p95' | cut -d' ' -f2)
    if [ "$error_rate" -gt "$BASELINE_ERROR_RATE" ]; then
        echo "ERROR: Error rate spike during deployment"
        ./rollback.sh
        exit 1
    fi
    sleep 5
done
wait $DEPLOY_PID
```

**Exceptions:** Non-critical internal tools where deployment monitoring is performed via regular production monitoring channels.

**Consequences Of Violation:** Deployment issues go undetected until they affect a significant number of users, turning a smooth deployment into a customer-facing incident.
