# Rules: CI/CD Pipeline Cache Invalidation Steps

---

### Rule 1: Always Include Explicit Cache Invalidation as a Required Pipeline Stage

**Category:** Reliability

**Rule:** Every CI/CD deployment pipeline for PHP must include a dedicated cache invalidation stage between the deploy stage and the warm-up stage. Never treat cache invalidation as an implicit side effect of deployment.

**Reason:** Deploying code without invalidating OpCache serves stale compiled code. The deployment copies new files to disk, but PHP-FPM workers continue serving old compiled opcodes from OpCache memory. The cache invalidation stage ensures the new code is actually executed.

**Bad Example:**
```yaml
stages:
  - build
  - deploy       # No cache invalidation or warm-up
  - health
```

**Good Example:**
```yaml
stages:
  - build
  - deploy
  - invalidate   # Explicit cache invalidation
  - warm         # Explicit cache warm-up
  - health
  - enable
```

**Exceptions:** Containerized deployments where each deployment builds a new image with pre-warmed OpCache file cache — the new image inherently has fresh cache.

**Consequences Of Violation:** Deployments that appear successful but serve stale code, causing developer confusion, delayed fixes, and potential production incidents.

---

### Rule 2: Verify OpCache State After Every Invalidation Operation

**Category:** Reliability

**Rule:** After calling opcache_reset() or cachetool, query opcache_get_status() to verify the invalidation succeeded. Never assume the reset worked based solely on the command's exit code.

**Reason:** opcache_reset() can fail silently due to permissions, disabled functions, or worker-specific memory segments. Without verification, a failed reset goes undetected, and users continue receiving stale cached code.

**Bad Example:**
```bash
cachetool opcache:reset --all
# No verification — assuming it worked
```

**Good Example:**
```bash
cachetool opcache:reset --all
# Verify hit rate dropped to 0
if ! curl -s http://localhost/opcache-status | grep '"hit_rate":0'; then
    echo "OpCache reset failed"
    exit 1
fi
```

**Exceptions:** None — verification is mandatory after every cache invalidation in production pipelines.

**Consequences Of Violation:** Undetected failed cache invalidation causes stale code incidents that are difficult to diagnose because the deployment pipeline reported success.

---

### Rule 3: Use Atomic Symlink Swap for Code Deployment, Never In-Place File Replacement

**Category:** Reliability

**Rule:** Deploy new code by creating a new release directory and atomically switching a symlink. Never copy files directly over the existing application directory.

**Reason:** In-place file replacement causes a window where PHP may read a mix of old and new files during compilation, leading to fatal errors from incompatible class definitions, missing methods, or broken autoloader mappings.

**Bad Example:**
```bash
# Direct rsync to application directory
rsync -a --delete /build/ /app/
systemctl reload php8.3-fpm
```

**Good Example:**
```bash
# Atomic symlink swap
mkdir /app/releases/v2
rsync -a /build/ /app/releases/v2/
ln -snf /app/releases/v2 /app/current
systemctl reload php8.3-fpm
```

**Exceptions:** Single-file hotfixes deployed during emergencies where the change is isolated and has no dependency chain.

**Consequences Of Violation:** Intermittent fatal errors during the deployment window as PHP reads partially written files, causing 500 errors for users.

---

### Rule 4: Implement Automated Rollback Triggered by Health Check Failure

**Category:** Reliability

**Rule:** Configure the pipeline to automatically roll back to the previous version if any health check fails after deployment. The rollback must follow the same stages in reverse: revert code, reload workers, warm cache, and verify health.

**Reason:** Manual rollback during a production incident takes too long. Engineers must diagnose, decide, and execute — a process that can take 10+ minutes. Automated rollback executes in under 60 seconds, minimizing user impact.

**Bad Example:**
```yaml
health:
  stage: health
  script: curl -s http://localhost/health | grep '"status":"ok"'
  # No rollback trigger on failure
```

**Good Example:**
```yaml
health:
  stage: health
  script: |
    if ! curl -s http://localhost/health | grep '"opcache_hit_rate":95'; then
      echo "Health check failed — triggering rollback"
      curl -X POST $CI_API_V4_URL/projects/$CI_PROJECT_ID/jobs/$CI_JOB_ID/rollback
    fi
```

**Exceptions:** Manual-approval deployments where a human explicitly confirms the health check results before full traffic enablement.

**Consequences Of Violation:** A failed deployment stays live while engineers scramble to diagnose and manually roll back, extending user-facing impact from seconds to minutes.

---

### Rule 5: Warm All Critical Endpoints After Cache Invalidation Before Health Check

**Category:** Performance

**Rule:** After cache invalidation, run an HTTP GET warm-up script that hits every critical application endpoint. Only then proceed to the health check stage. Never route user traffic to cold workers.

**Reason:** Each unique URL path touches different sets of PHP files. Without comprehensive warm-up, the first user hitting each endpoint triggers on-demand compilation, causing 3-5 second response times for the first few requests.

**Bad Example:**
```yaml
warm:
  stage: warm
  script: curl -s -o /dev/null http://localhost/health
  # Only warms the health endpoint
```

**Good Example:**
```yaml
warm:
  stage: warm
  script: |
    for url in / /api/health /api/products /api/users /api/orders; do
      curl -s -o /dev/null http://localhost$url
    done
```

**Exceptions:** Microservices with a single endpoint where warming that endpoint is sufficient.

**Consequences Of Violation:** Users experience poor performance immediately after every deployment, eroding trust in the application and negating the benefits of zero-downtime deployment.

---

### Rule 6: Keep a Post-Deployment Monitoring Window for at Least 10 Minutes After Traffic Enablement

**Category:** Reliability

**Rule:** After the deployment completes and traffic is enabled, monitor error rates, latency, and OpCache hit rate for at least 10 minutes before considering the deployment fully successful.

**Reason:** Late-onset issues such as memory leaks, slow degradation, or cache stampedes may not appear immediately after deployment. A monitoring window catches problems that pass the initial health check.

**Bad Example:**
```yaml
# Pipeline ends immediately after health check passes
health:
  stage: health
  script: curl -s http://localhost/health | grep '"status":"ok"'
  # No post-deployment monitoring
```

**Good Example:**
```yaml
monitor:
  stage: monitor
  script: |
    for i in $(seq 1 20); do
      status=$(curl -s http://localhost/health)
      if ! echo "$status" | grep -q '"status":"ok"'; then
        echo "Monitoring failure at iteration $i"
        # Trigger rollback
        exit 1
      fi
      sleep 30
    done
    echo "Post-deployment monitoring passed"
```

**Exceptions:** Emergency hotfixes where the risk of keeping the current state is greater than the risk of an unmonitored deployment.

**Consequences Of Violation:** Late-onset issues go undetected until users report them, turning a deployment success into an incident that is harder to correlate with the deployment.

---

### Rule 7: Use Different Configuration for Development and Production OpCache Settings

**Category:** Maintainability

**Rule:** Maintain separate php.ini files or environment-specific configurations where development uses validate_timestamps=1 and production uses validate_timestamps=0. Never apply production cache settings to development environments.

**Reason:** Development requires immediate code visibility — validate_timestamps=0 in development makes code changes invisible until manual invalidation, confusing developers and slowing iteration. Production requires performance — validate_timestamps=1 wastes CPU on unnecessary stat() calls.

**Bad Example:**
```yaml
# Same php.ini for all environments
deploy:
  script: |
    cp /build/php.ini /etc/php/8.3/cli/conf.d/opcache.ini
```

**Good Example:**
```yaml
deploy:
  script: |
    if [ "$ENVIRONMENT" = "production" ]; then
      cp /build/php.production.ini /etc/php/8.3/fpm/conf.d/opcache.ini
    else
      cp /build/php.development.ini /etc/php/8.3/fpm/conf.d/opcache.ini
    fi
```

**Exceptions:** None — environment-specific configuration is a fundamental deployment practice.

**Consequences Of Violation:** Production performance degradation from unnecessary stat() calls, or development environments where code changes are invisible, wasting developer time.
