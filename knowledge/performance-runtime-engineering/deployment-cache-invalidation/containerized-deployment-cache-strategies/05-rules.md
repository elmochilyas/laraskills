# Rules: Containerized Deployment Cache Strategies

---

### Rule 1: Pre-Warm OpCache File Cache During CI/CD Image Build

**Category:** Performance

**Rule:** During the container image build step in CI/CD, run a PHP script that compiles all application files and writes OpCache file cache. Include the file cache directory in the built image so containers start fully warm.

**Reason:** Without pre-warming, each new container starts with an empty OpCache. The first request triggers on-demand compilation of all PHP files, causing 3-5 second response times. Pre-warming during build eliminates this cold-start latency entirely.

**Bad Example:**
```dockerfile
FROM dunglas/frankenphp:latest
COPY . /app
# No OpCache pre-warming — container starts cold
```

**Good Example:**
```dockerfile
FROM dunglas/frankenphp:latest
COPY . /app
# Pre-warm OpCache file cache during build
RUN php -d opcache.file_cache=/tmp/opcache \
       -d opcache.file_cache_only=1 \
       /app/artisan opcache:warm
RUN cp -r /tmp/opcache /app/opcache-cache
```

**Exceptions:** Containers with extremely short lifespans (batch jobs under 10 seconds) where build time overhead exceeds the cold-start penalty.

**Consequences Of Violation:** Every new container serves slow responses to early users, degrading the user experience during scaling events, deployments, and pod restarts.

---

### Rule 2: Use Persistent Volumes for OpCache File Cache Across Container Restarts

**Category:** Performance

**Rule:** Mount a persistent volume (hostPath, PVC, or similar) for the OpCache file cache directory. Configure the file cache path to point to this volume so it survives container restarts within the same node.

**Reason:** Even with pre-warming, containers restart for various reasons (node maintenance, OOM kills, config changes). Without a persistent volume, the file cache is rebuilt on every restart, wasting CPU and extending warm-up time.

**Bad Example:**
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: php-app
      # No volume mount for OpCache — cache lost on restart
      command: ["php-fpm"]
```

**Good Example:**
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: php-app
      volumeMounts:
        - name: opcache-cache
          mountPath: /app/opcache-cache
  volumes:
    - name: opcache-cache
      hostPath:
        path: /var/opcache-cache
```

**Exceptions:** Stateless deployments in auto-scaling groups where containers are ephemeral and never restart on the same node.

**Consequences Of Violation:** Avoidable CPU waste from repeated OpCache file compilation on every container restart within the same node.

---

### Rule 3: Configure Kubernetes Readiness Probe to Verify OpCache Hit Rate Before Routing Traffic

**Category:** Reliability

**Rule:** The readiness probe should not merely check HTTP 200 status. It must verify that OpCache hit rate exceeds a threshold (typically 95%) before the pod is marked ready to receive traffic.

**Reason:** A pod can return HTTP 200 while OpCache is still cold. Kubernetes will route traffic to it, and users experience slow responses. The readiness probe must guard the quality of service, not just service availability.

**Bad Example:**
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 10
```

**Good Example:**
```yaml
readinessProbe:
  httpGet:
    path: /health/opcache
    port: 80
    httpHeaders:
      - name: Accept
        value: application/json
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 6
```
```php
// /health/opcache endpoint
$status = opcache_get_status(false);
if (!$status || ($status['hit_rate'] ?? 0) < 95) {
    http_response_code(503);
    echo json_encode(['ready' => false, 'opcache_hit_rate' => $status['hit_rate'] ?? 0]);
    exit;
}
echo json_encode(['ready' => true, 'opcache_hit_rate' => $status['hit_rate']]);
```

**Exceptions:** Non-critical internal services where brief cold-start latency is acceptable.

**Consequences Of Violation:** Users experience intermittent slow responses when new pods are scaled up or deployed, eroding confidence in the application's performance.

---

### Rule 4: Never Rely Solely on Shared Memory OpCache in Container Environments Without Warm-Up

**Category:** Performance

**Rule:** When using shared memory OpCache in containers (the default mode), always implement a warm-up mechanism. Never start accepting traffic without first populating the OpCache through pre-warming or readiness probe warm-up.

**Reason:** Container shared memory is process-scoped and lost on restart. Without warm-up, every new container compiles files on first request. Shared memory mode without warm-up is the worst of all container OpCache strategies.

**Bad Example:**
```ini
; Default OpCache config — shared memory, no warm-up
opcache.enable=1
opcache.memory_consumption=256
; No file cache, no pre-warming
```

**Good Example:**
```ini
; File cache-based strategy with warm-up
opcache.enable=1
opcache.file_cache=/app/opcache-cache
opcache.file_cache_only=0
opcache.validate_timestamps=0
```

**Exceptions:** Development containers where cold-start latency is acceptable.

**Consequences Of Violation:** Every container start causes a CPU spike from compilation, and the first user on each container experiences 3-5 second response times.

---

### Rule 5: Clean or Version the OpCache File Cache Directory on Each New Deployment

**Category:** Reliability

**Rule:** When deploying a new container image version that includes changes to PHP files, ensure the OpCache file cache directory is either cleaned (deleted and regenerated) or versioned (different path per deployment). Never use the same file cache across different code versions.

**Reason:** Old OpCache file cache contains compiled bytecode from the previous code version. If the file cache persists unchanged, the new container may load stale compiled code that doesn't match the new source files, causing fatal errors.

**Bad Example:**
```dockerfile
COPY . /app
COPY opcache-cache /app/opcache-cache  # Old cache may conflict with new code
```

**Good Example:**
```dockerfile
COPY . /app
# Build fresh cache for the new code version
RUN php -d opcache.file_cache=/tmp/opcache \
       -d opcache.file_cache_only=1 \
       /app/artisan opcache:warm
RUN rm -rf /app/opcache-cache && cp -r /tmp/opcache /app/opcache-cache
```

**Exceptions:** Deployments where only static assets changed and no PHP files were modified.

**Consequences Of Violation:** Fatal errors, class not found errors, or silent incorrect behavior from bytecode/source mismatch after deployment.
