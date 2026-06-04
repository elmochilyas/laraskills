# Rules: Blue-Green Deployment

## BG-001: Database Backward Compatibility
**Condition:** Blue-green deployment strategy in use
**Action:** All database migrations must be backward-compatible with both blue and green code versions
**Rationale:** During switchover, both environments execute against the same database with different code versions
**Consequences:** Violation causes application errors on rollback or partial switchover states

## BG-002: Health Check Gate Required
**Condition:** Traffic switch from blue to green environment
**Action:** Automated health checks must pass before traffic switch occurs
**Rationale:** Deploying unhealthy code to the idle environment must not propagate to users
**Consequences:** Violation allows broken releases to serve production traffic

## BG-003: Automated Traffic Switch
**Condition:** Blue-green deployment pipeline
**Action:** Traffic switch must be automated, not manual
**Rationale:** Manual switches introduce human error, latency, and no audit trail
**Consequences:** Violation leads to prolonged switchover windows and switch failure incidents

## BG-004: Idle Environment Cleanup
**Condition:** Blue-green switch completed successfully
**Action:** Schedule teardown of previous idle environment after rollback grace period
**Rationale:** Idle environments consume resources and accumulate configuration drift
**Consequences:** Violation doubles infrastructure cost indefinitely

## BG-005: Shared File Storage
**Condition:** Blue-green deployment with file uploads
**Action:** Use shared storage (S3, EFS) accessible from both environments
**Rationale:** Files uploaded to one environment must be visible after traffic switch
**Consequences:** Violation causes missing file references after blue-green switch
