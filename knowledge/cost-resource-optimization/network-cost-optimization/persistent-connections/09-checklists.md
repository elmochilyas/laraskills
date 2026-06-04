# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** Persistent Connections
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Persistent connections enabled for PHP-FPM
- [ ] Health check implemented (SELECT 1 before queries)
- [ ] wait_timeout configured higher than max idle period
- [ ] Connection refresh in Octane workers
- [ ] No persistent connections conflict with pooler (if using both)
- [ ] Enable persistent connections in PHP-FPM applied
- [ ] Implement connection health checks applied
- [ ] Use Octane's connection management applied
- [ ] Enable Persistent Connections for PHP-FPM to Reduce Auth Overhead followed
- [ ] Implement Health Checks (SELECT 1) to Detect Stale Connections followed
- [ ] Use Octane Connection Management Explicitly Ã¢â‚¬â€ Disconnect After Heavy Jobs followed
- [ ] Persistent connections across tenants prevented
- [ ] Persistent connections on ephemeral workers prevented
- [ ] Persistent connections without health checks prevented
- [ ] Persistent connections + PgBouncer transaction pooling prevented

---

# Architecture Checklist

- [ ] Architecture guideline: PHP-FPM
- [ ] Architecture guideline: Octane
- [ ] Architecture guideline: Set `PDO::ATTR_EMULATE_PREPARES` to false for prepared statement reuse (memory saving)
- [ ] Architecture guideline: Configure `MYSQL_ATTR_INIT_COMMAND` to set session variables (e.g., timezone, charset)
- [ ] Architecture guideline: Monitor connection age (old connections are more likely to be stale)
- [ ] Architecture guideline: Use connection pooler with persistent connections for maximum efficiency
- [ ] Enable Persistent Connections for PHP-FPM to Reduce Auth Overhead followed
- [ ] Implement Health Checks (SELECT 1) to Detect Stale Connections followed
- [ ] Use Octane Connection Management Explicitly Ã¢â‚¬â€ Disconnect After Heavy Jobs followed
- [ ] Set wait_timeout Higher Than Maximum Idle Period followed
- [ ] Disable PHP-FPM Persistent Connections When Using Connection Pooler followed

---

# Implementation Checklist

- [ ] Best practice applied: Enable persistent connections in PHP-FPM
- [ ] Best practice applied: Implement connection health checks
- [ ] Best practice applied: Use Octane's connection management
- [ ] Best practice applied: Set `wait_timeout` higher than idle time
- [ ] Best practice applied: Test with connection pooler
- [ ] Enable Persistent Connections for PHP-FPM to Reduce Auth Overhead followed
- [ ] Implement Health Checks (SELECT 1) to Detect Stale Connections followed
- [ ] Use Octane Connection Management Explicitly Ã¢â‚¬â€ Disconnect After Heavy Jobs followed
- [ ] Set wait_timeout Higher Than Maximum Idle Period followed
- [ ] Disable PHP-FPM Persistent Connections When Using Connection Pooler followed
- [ ] Workflow step completed: Inventory current Persistent Connections resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Connection creation saved
- [ ] CPU saved
- [ ] Memory cost
- [ ] Stale connection cost
- [ ] max_requests 500

---

# Security Checklist

- [ ] Persistent connections may hold user-specific session state (session variables, temporary tables)
- [ ] Use connection pooler to isolate connections between requests
- [ ] Ensure TLS connection persists correctly (some TLS implementations expire)
- [ ] Monitor failed connection attempts (stale connections can cause repeated auth failures)

---

# Reliability Checklist

- [ ] Mistake prevented: Persistent connections without health checks
- [ ] Mistake prevented: Persistent connections + PgBouncer transaction pooling
- [ ] Mistake prevented: No max_requests with persistence
- [ ] Mistake prevented: Octane without connection refresh

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Persistent connections enabled for PHP-FPM
- [ ] Health check implemented (SELECT 1 before queries)
- [ ] wait_timeout configured higher than max idle period
- [ ] Connection refresh in Octane workers
- [ ] No persistent connections conflict with pooler (if using both)
- [ ] max_requests configured to refresh connections periodically
- [ ] "MySQL has gone away" error rate = 0%

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Persistent Connections configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Enable Persistent Connections for PHP-FPM to Reduce Auth Overhead followed
- [ ] Implement Health Checks (SELECT 1) to Detect Stale Connections followed
- [ ] Use Octane Connection Management Explicitly Ã¢â‚¬â€ Disconnect After Heavy Jobs followed
- [ ] Set wait_timeout Higher Than Maximum Idle Period followed
- [ ] Disable PHP-FPM Persistent Connections When Using Connection Pooler followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Persistent connections across tenants
- [ ] Anti-pattern prevented: Persistent connections on ephemeral workers
- [ ] Anti-pattern prevented: No connection timeout
- [ ] Common mistake prevented: Persistent connections without health checks
- [ ] Common mistake prevented: Persistent connections + PgBouncer transaction pooling
- [ ] Common mistake prevented: No max_requests with persistence
- [ ] Common mistake prevented: Octane without connection refresh

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Persistent connections enabled for PHP-FPM
- [ ] Verification passed: Health check implemented (SELECT 1 before queries)
- [ ] Verification passed: wait_timeout configured higher than max idle period

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
