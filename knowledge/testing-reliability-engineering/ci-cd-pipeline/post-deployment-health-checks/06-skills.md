# Skill: Implement Post-Deployment Health Checks

## Purpose
Create and configure post-deployment health checks for Laravel applications that validate database connectivity, cache availability, queue responsiveness, and critical business transactions after deployment.

## When To Use
- After every production deployment as the final quality gate
- In load balancer health check configurations
- In Kubernetes liveness/readiness probe configurations
- When deploying to new environments or after infrastructure changes
- For compliance-required uptime and availability monitoring

## When NOT To Use
- As a substitute for proper pre-deployment testing (unit, feature, E2E)
- When health endpoint exposes sensitive information (stack traces, internal config)
- Without network-level access control (health endpoints should be internal-only)
- With hard dependency requirements that cause false-positive rollbacks

## Prerequisites
- Laravel routing and middleware knowledge
- Deployment strategy (Deployer, Forge, Kubernetes)
- Load balancer configuration access
- Monitoring and alerting system

## Inputs
- Critical service dependencies (database, cache, queue, storage)
- Health endpoint URL and expected response format
- Deployment pipeline configuration for health check integration
- Rollback procedure and automated triggers
- Load balancer health check interval configuration

## Workflow
1. Create a health check endpoint (e.g., `/health` or `/api/health`) with middleware excluded from auth/session
2. Layer checks: fast liveness check (no dependencies) and full readiness check (all dependencies)
3. Implement dependency checks: database ping, cache set/get, queue connection (Horizon status)
4. Use three-tier response: `ok`, `degraded` (non-critical failure), `failure` (critical failure)
5. Add rate limiting to the health endpoint
6. Integrate into deployment pipeline as a post-deploy step that curls the endpoint
7. Configure automated rollback on health check failure within first 5 minutes
8. Configure load balancer to use the health endpoint for instance health evaluation
9. Add transaction smoke test for critical business flows in the deployment pipeline

## Validation Checklist
- [ ] Health endpoint returns 200 when all critical services are healthy
- [ ] Health endpoint returns non-200 when critical services are unavailable
- [ ] Health endpoint does not require authentication
- [ ] Health endpoint excludes sensitive information from responses
- [ ] Health endpoint bypasses session and auth middleware
- [ ] Health check is integrated into deployment pipeline as post-deploy gate
- [ ] Automated rollback is configured on health check failure
- [ ] Load balancer uses health endpoint for instance health evaluation
- [ ] Rate limiting is configured to prevent accidental DDoS from monitoring

## Common Failures
- Health endpoint depends on database — unnecessary rollbacks during maintenance
- Health endpoint behind authentication — load balancers can't check it
- No health endpoint at all — TCP health check passes while app returns 500
- All-or-nothing response — cache failure triggers rollback when app could still function
- No automated rollback — manual rollback takes 5-15 minutes
- Health endpoint in same middleware stack — circular failure with session/database

## Decision Points
- Liveness vs readiness — liveness for load balancer (fast, no deps), readiness for deployment pipeline (full checks)
- `ok`/`degraded`/`failure` vs binary — three-tier for granularity, binary for simplicity
- Transaction smoke test vs dependency-only — transaction test for full-stack verification, dependency-only for speed

## Performance Considerations
- Simple liveness check: <10ms (no PHP framework boot at web server level)
- Full dependency check: 50-500ms depending on service response times
- Transaction smoke test: 200-2000ms depending on business logic complexity
- Rate limit health endpoint: 1 request per second per instance
- Health endpoint should not trigger full Laravel session, auth, or middleware stack

## Security Considerations
- Restrict health endpoints to internal network via firewall rules
- Never expose stack traces or environment information in health responses
- Return only status indicators per service — no error messages or details
- Use separate health endpoint for internal (detailed) vs external (simple OK) consumers
- Health check integration in CI should use authenticated endpoints if exposed externally

## Related Rules
- [Rule: Layer Health Checks by Criticality](./05-rules.md)
- [Rule: Exclude Health Route from Middleware Stack](./05-rules.md)
- [Rule: Automate Rollback on Health Check Failure](./05-rules.md)

## Related Skills
- Zero-Downtime Deployment
- CI/CD Pipeline Design
- Graceful Degradation Patterns

## Success Criteria
- [ ] Health endpoint returns appropriate status for all service states
- [ ] Post-deploy health check is integrated into the deployment pipeline
- [ ] Automated rollback triggers on health check failure
- [ ] Load balancer uses the health endpoint for instance health
- [ ] Transaction smoke test covers at least one critical business flow
