# Rules: Multi-Instance Cache Coordination

---

### Rule 1: Always Invalidate OpCache on Every Instance Explicitly

**Category:** Reliability

**Rule:** When invalidating OpCache across multiple instances, explicitly target every instance. Use cachetool with multi-host support or iterate over all hosts. Never assume one invalidation operation covers the fleet.

**Reason:** OpCache is per-machine SysV shared memory. There is no shared or distributed OpCache. Each PHP-FPM instance has its own independent OpCache that must be invalidated separately. Missing even one instance means that instance serves stale code.

**Bad Example:**
```bash
# Only the first instance is invalidated
cachetool opcache:reset --web --web-path=http://web1/opcache.php
```

**Good Example:**
```bash
# All instances invalidated explicitly
cachetool opcache:reset --all
# or
for host in web1 web2 web3; do
    cachetool opcache:reset --web --web-path=http://$host/opcache.php
done
```

**Exceptions:** Blue-green deployments where traffic is atomically switched — only the new environment needs invalidation.

**Consequences Of Violation:** Stale code on uninvalidated instances creates inconsistent user experiences and difficult-to-diagnose bugs that are often dismissed as "cache issues."

---

### Rule 2: Enable Sticky Sessions on the Load Balancer for Rolling Deployments

**Category:** Reliability

**Rule:** Configure load balancer session affinity (sticky sessions) when using rolling deployments across multiple instances. This ensures a user's requests consistently hit instances running the same code version during the transition window.

**Reason:** Without sticky sessions, a user's requests may alternate between old and new instances during a rolling deployment. This causes inconsistent responses, session corruption, and a confusing user experience.

**Bad Example:**
```nginx
upstream app {
    server web1:9000;
    server web2:9000;
    server web3:9000;
}
```

**Good Example:**
```nginx
upstream app {
    ip_hash;
    server web1:9000;
    server web2:9000;
    server web3:9000;
}
```

**Exceptions:** Stateless API endpoints where response format is guaranteed identical across versions and no session state exists.

**Consequences Of Violation:** Users experience inconsistent application behavior during deployments, causing errors, session timeouts, and support escalations.

---

### Rule 3: Warm and Health-Check Each Instance Independently Before It Accepts Traffic

**Category:** Performance

**Rule:** For each instance in a multi-instance deployment, run a complete warm-up cycle (hit all critical endpoints) and health check (verify OpCache hit rate) before allowing the instance to serve user traffic.

**Reason:** Each instance starts with a cold OpCache after deployment or restart. If an instance receives traffic before warm-up completes, users hitting that instance experience 3-5x latency. Independent per-instance warm-up ensures every instance is ready before serving.

**Bad Example:**
```bash
# Warming only one instance, assuming others are covered
for url in / /api/health; do
    curl -s -o /dev/null http://web1$url
done
```

**Good Example:**
```bash
# Warm and health-check each instance independently
for host in web1 web2 web3; do
    for url in / /api/health /api/products /api/users; do
        curl -s -o /dev/null http://$host$url
    done
    curl -s http://$host/health | grep '"opcache_hit_rate":95'
done
```

**Exceptions:** Blue-green deployments where the entire new environment is warmed before any instance receives traffic.

**Consequences Of Violation:** Inconsistent performance across instances — some respond quickly while others are slow, creating a confusing user experience and making performance issues hard to diagnose.

---

### Rule 4: Never Invalidate All Instances Simultaneously

**Category:** Reliability

**Rule:** Stagger cache invalidation and warm-up across instances. Never trigger opcache_reset() or PHP-FPM reload on all instances at the same time.

**Reason:** Simultaneous invalidation causes all instances to recompile OpCache at once, creating a CPU spike across the entire fleet. This can overwhelm the application servers, increase request latency, and potentially cause cascading failures.

**Bad Example:**
```bash
# All instances invalidated simultaneously
parallel-ssh -h hosts.txt "cachetool opcache:reset --all"
```

**Good Example:**
```bash
# Stagger invalidation across instances
for host in web1 web2 web3; do
    cachetool opcache:reset --web --web-path=http://$host/opcache.php
    sleep 10  # Wait before moving to next instance
done
```

**Exceptions:** Blue-green deployments where the entire green environment is invalidated simultaneously because blue is still serving traffic.

**Consequences Of Violation:** Fleet-wide CPU spike causing increased latency across all requests, potentially triggering auto-scaling events or health-check failures.

---

### Rule 5: Use SSH-Based cachetool for Environments Without HTTP Endpoint Access

**Category:** Security

**Rule:** When the OpCache reset web endpoint is not accessible (firewall restrictions, no web endpoint configured), use cachetool's SSH mode instead. Never expose the OpCache reset endpoint to the public internet.

**Reason:** The OpCache reset web endpoint (/opcache.php or similar) executes opcache_reset() via HTTP. If exposed to the internet, any attacker can repeatedly invalidate your cache, causing denial of service through CPU exhaustion and degraded performance.

**Bad Example:**
```bash
# HTTP endpoint accessible from any network
cachetool opcache:reset --web --web-path=http://public-ip/opcache.php
```

**Good Example:**
```bash
# SSH-based invalidation (secure, no HTTP endpoint needed)
cachetool opcache:reset --ssh --user=deploy --host=web1
```

**Exceptions:** Internal networks with strict firewall rules where the OpCache endpoint is restricted to trusted IPs only.

**Consequences Of Violation:** Unauthenticated cache manipulation by attackers, leading to performance degradation or denial of service.

---

### Rule 6: Monitor OpCache Hit Rate Per Instance During and After Deployment

**Category:** Maintainability

**Rule:** Track OpCache hit rate as a per-instance metric during the deployment window. Alert if any instance's hit rate drops below 95% after the warm-up period completes.

**Reason:** A low hit rate on a specific instance indicates a warm-up failure, preloading error, or OpCache memory exhaustion. Without per-instance monitoring, a single cold instance goes undetected while serving slow responses to a portion of users.

**Bad Example:**
```bash
# Only checking fleet-level metrics
curl -s http://web1/health | grep '"opcache_hit_rate"'
```

**Good Example:**
```bash
# Per-instance monitoring during deployment
for host in web1 web2 web3; do
    hit_rate=$(curl -s http://$host/health | python -c "import sys, json; print(json.load(sys.stdin)['opcache_hit_rate'])")
    if [ "$hit_rate" -lt 95 ]; then
        echo "WARNING: $host hit rate is $hit_rate%"
        # Trigger targeted warm-up
    fi
done
```

**Exceptions:** Single-instance deployments where fleet-level monitoring is sufficient.

**Consequences Of Violation:** Undetected cold instances degrade the performance of a subset of users, making performance issues seem random and intermittent.
