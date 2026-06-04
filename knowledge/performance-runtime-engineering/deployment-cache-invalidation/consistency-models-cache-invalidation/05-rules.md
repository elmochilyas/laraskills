# Rules: Consistency Models for Cache Invalidation

---

### Rule 1: Choose and Document a Consistency Model for Every Service Before Deployment

**Category:** Architecture

**Rule:** Each service must have a documented consistency model (strong or eventual) that is explicitly chosen based on service criticality and tolerance for mixed-version execution. Never deploy without a documented consistency choice.

**Reason:** Without an explicit consistency model, deployments default to eventual consistency, which may cause data corruption in write-heavy services. Teams must consciously decide the tradeoff between infrastructure cost and consistency guarantees.

**Bad Example:**
```yaml
# No consistency model documented — defaults to rolling deployment
deploy:
  script: ansible-playbook deploy.yml
```

**Good Example:**
```yaml
# Consistency model documented in deployment configuration
variables:
  CONSISTENCY_MODEL: "strong"  # or "eventual"
  ROLLBACK_STRATEGY: "blue-green"
deploy:
  script: |
    if [ "$CONSISTENCY_MODEL" = "strong" ]; then
      ./deploy-blue-green.sh
    else
      ./deploy-rolling.sh
    fi
```

**Exceptions:** Prototype services that can tolerate brief downtime and have no user-facing traffic.

**Consequences Of Violation:** Inconsistent behavior during deployments, undiagnosed data corruption in write-heavy services, and incident response confusion about expected behavior.

---

### Rule 2: Prefer Strong Consistency for Write-Heavy Endpoints and Eventual Consistency for Read-Heavy Endpoints

**Category:** Architecture

**Rule:** Use strong consistency (blue-green deployment) for services that handle writes or state mutations. Use eventual consistency (rolling deployment) for read-only or read-heavy services where backward-compatible responses are guaranteed.

**Reason:** Mixed-version execution during eventual consistency deployments can cause data inconsistencies if the write format changes between versions. A write from new code followed by a read from old code that doesn't understand the new format creates data corruption or loss.

**Bad Example:**
```yaml
# Payment processing deployed with eventual consistency
deploy:
  script: ./deploy-rolling.sh
# Payment data corrupted when old workers read new-format transactions
```

**Good Example:**
```yaml
# Payment processing uses strong consistency
services:
  payment-service:
    consistency: strong
    deploy: ./deploy-blue-green.sh
  product-catalog:
    consistency: eventual
    deploy: ./deploy-rolling.sh
```

**Exceptions:** Write endpoints that are guaranteed backward-compatible across the deployment window (additive-only changes).

**Consequences Of Violation:** Silent data corruption during deployments that goes undetected until downstream consumers report inconsistencies days later.

---

### Rule 3: Always Apply Database Schema Changes Before Code Changes in the Deployment Pipeline

**Category:** Maintainability

**Rule:** Separate schema migrations from code deployments. Apply all backward-compatible schema changes first, verify them, then deploy the code that uses the new schema. Never deploy schema and code changes atomically.

**Reason:** During rolling deployments, old workers continue serving with the new schema. If the schema change is applied after the code deploy, old workers crash. If applied atomically, rollback becomes impossible without schema revert.

**Bad Example:**
```yaml
stages:
  - build
  - deploy_code_and_schema  # Atomic schema+code deployment
```

**Good Example:**
```yaml
stages:
  - build
  - deploy_schema     # Apply backward-compatible schema first
  - verify_schema
  - deploy_code       # Then deploy code that uses new schema
  - warm
  - health
```

**Exceptions:** Greenfield deployments with no existing production traffic.

**Consequences Of Violation:** Old workers crash with database errors during rolling deployments, causing partial service outages and failed endpoints.

---

### Rule 4: Enable Sticky Sessions (Session Affinity) on the Load Balancer When Using Eventual Consistency

**Category:** Reliability

**Rule:** When deploying with eventual consistency (rolling deployment), configure the load balancer for sticky sessions so that a user's requests consistently hit instances running the same code version.

**Reason:** Without sticky sessions, a user's requests may bounce between old and new instances during the deployment window. This causes inconsistent behavior — the user might see different response formats, encounter missing features, or experience session corruption.

**Bad Example:**
```nginx
upstream app {
    server web1:9000;
    server web2:9000;
    server web3:9000;
    # No ip_hash or sticky session configuration
}
```

**Good Example:**
```nginx
upstream app {
    ip_hash;  # Sticky sessions via IP hash
    server web1:9000;
    server web2:9000;
    server web3:9000;
}
```

**Exceptions:** Stateless API endpoints where response format is guaranteed identical across versions.

**Consequences Of Violation:** Users experience inconsistent application behavior during deployments, leading to confusion, failed operations, and support tickets.

---

### Rule 5: Never Assume OpCache Invalidation Is a Cluster-Wide Operation

**Category:** Performance

**Rule:** Treat OpCache invalidation as inherently per-instance. When invalidating cache in a multi-instance deployment, explicitly verify the operation on every instance. Never assume one instance's invalidation propagates to others.

**Reason:** OpCache uses per-machine SysV shared memory or mmap. There is no network-distributed OpCache. Horizontal scaling with N instances means N independent OpCaches, each requiring independent invalidation.

**Bad Example:**
```bash
# Invalidating only one instance
cachetool opcache:reset --web --web-path=http://web1/opcache.php
```

**Good Example:**
```bash
# Invalidating all instances explicitly
for host in web1 web2 web3; do
    cachetool opcache:reset --web --web-path=http://$host/opcache.php
done
# Or use cachetool --all
cachetool opcache:reset --all
```

**Exceptions:** Single-server deployments with only one OpCache instance.

**Consequences Of Violation:** Some servers serve stale code while others serve new code, creating inconsistent user experiences and difficult-to-diagnose bugs.

---

### Rule 6: Test Mixed-Version Operation in Staging When Using Eventual Consistency

**Category:** Testing

**Rule:** When the chosen consistency model is eventual consistency, run integration tests in staging where some instances run old code and some run new code simultaneously. Verify backward compatibility before production deployment.

**Reason:** Backward compatibility is an assumption, not a guarantee. Code changes that appear backward-compatible may have subtle incompatibilities that only surface under mixed-version traffic patterns.

**Bad Example:**
```bash
# Deploying to production without testing mixed-version behavior
ansible-playbook deploy-production.yml --limit 50%
# Assuming old and new will work together
```

**Good Example:**
```bash
# Test mixed-version compatibility in staging first
ansible-playbook deploy-staging.yml --limit 50%
# Run integration tests against both old and new instances
curl http://staging-old/api/v1/users
curl http://staging-new/api/v2/users
# Compare response formats, verify no breaking changes
```

**Exceptions:** None — mixed-version testing is mandatory for any service using eventual consistency.

**Consequences Of Violation:** Production incidents during rolling deployments when old and new code incompatibilities cause errors, data corruption, or service degradation.
