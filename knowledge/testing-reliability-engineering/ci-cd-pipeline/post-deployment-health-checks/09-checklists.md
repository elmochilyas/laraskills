# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Post-Deployment Health Checks
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Layer Health Checks by Criticality â€” Liveness vs Readiness
- [ ] Apply rule: Exclude Health Route from Middleware Stack
- [ ] Apply rule: Return Degraded (Not Failure) for Non-Critical Services
- [ ] Apply rule: Automate Rollback on Health Check Failure
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Health endpoint returns 200 when all critical services are healthy
- [ ] Health endpoint returns non-200 when critical services are unavailable
- [ ] Health endpoint does not require authentication
- [ ] Health endpoint excludes sensitive information from responses
- [ ] Health endpoint bypasses session and auth middleware
- [ ] Avoid: Mistake
- [ ] Avoid: Health endpoint requires database
- [ ] Avoid: Health endpoint returns sensitive info

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Health endpoint placement**: Separate route before Laravel bootstrap (fastest) or a simple Laravel route (more detailed checks). For dependency checks, use Laravel route.
- **Authentication**: Health endpoints should not require authentication. Use network-level access control (firewall, internal network) instead.
- **Check frequency**: Load balancer: every 5-10 seconds. CI post-deploy: once. Monitoring system: every minute.
- **Response format**: JSON response with `{ "status": "ok" | "degraded" | "failure", "services": { ... } }`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Layer Health Checks by Criticality â€” Liveness vs Readiness
- [ ] Follow rule: Exclude Health Route from Middleware Stack
- [ ] Follow rule: Return Degraded (Not Failure) for Non-Critical Services
- [ ] Follow rule: Automate Rollback on Health Check Failure
- [ ] Follow rule: Never Expose Sensitive Information in Health Responses
- [ ] Follow rule: Implement Transaction Smoke Test for Critical Flows
- [ ] - [ ] Health endpoint returns 200 when all critical services are healthy
- [ ] - [ ] Health endpoint returns non-200 when critical services are unavailable
- [ ] - [ ] Health endpoint does not require authentication
- [ ] - [ ] Health endpoint excludes sensitive information from responses

# Performance Checklist
- Simple liveness check: <10ms (no PHP framework boot if at web server level).
- Full dependency check: 50-500ms depending on service response times.
- Transaction smoke test: 200-2000ms depending on business logic complexity.
- Health endpoint should not trigger full Laravel session, auth, or middleware stack.
- Rate limit health endpoint: 1 request per second per instance.

# Security Checklist
- Health endpoints are an attack surface. Restrict to internal network via firewall rules.
- Never expose stack traces, configuration details, or environment information in health responses.
- Return only "ok", "degraded", or "failure" status per service. No error messages.
- Use separate health endpoint for internal (detailed) vs external (simple OK) consumers.

# Reliability Checklist
- [ ] Ensure: Post-deployment health checks validate that a Laravel application is functioning...
- [ ] Verify: Layer Health Checks by Criticality â€” Liveness vs Readiness
- [ ] Verify: Exclude Health Route from Middleware Stack
- [ ] Verify: Return Degraded (Not Failure) for Non-Critical Services
- [ ] Verify: Automate Rollback on Health Check Failure

# Testing Checklist
- [ ] Health endpoint returns 200 when all critical services are healthy
- [ ] Health endpoint returns non-200 when critical services are unavailable
- [ ] Health endpoint does not require authentication
- [ ] Health endpoint excludes sensitive information from responses
- [ ] Health endpoint bypasses session and auth middleware
- [ ] Health check is integrated into deployment pipeline as post-deploy gate
- [ ] Avoid: Mistake
- [ ] Avoid: Health endpoint requires database
- [ ] Avoid: Health endpoint returns sensitive info

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Layer Health Checks by Criticality â€” Liveness vs Readiness
- [ ] Apply: Exclude Health Route from Middleware Stack
- [ ] Apply: Return Degraded (Not Failure) for Non-Critical Services
- [ ] Apply: Automate Rollback on Health Check Failure

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Health endpoint requires database
- [ ] Avoid mistake: Health endpoint returns sensitive info
- [ ] Avoid mistake: No health endpoint at all
- [ ] Avoid mistake: Health check in same middleware stack

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Layer Health Checks by Criticality â€” Liveness vs Readiness
- Exclude Health Route from Middleware Stack
- Return Degraded (Not Failure) for Non-Critical Services
- Automate Rollback on Health Check Failure
- Never Expose Sensitive Information in Health Responses
- Implement Transaction Smoke Test for Critical Flows
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Post-Deployment Health Checks


