# Metadata

**Domain:** api-integration-engineering
**Subdomain:** package-landscape
**Knowledge Unit:** 09-package-landscape
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `composer audit` shows zero vulnerabilities
- [ ] All package versions are compatible with the project's Laravel version
- [ ] Circuit breaker implemented for all external API calls (sync and queue)
- [ ] Add Circuit Breaker for All External API Calls
- [ ] Choose Managed Gateway Only for 10K+ Daily Webhooks
- [ ] Default to Saloon + Spatie for New Integrations
- [ ] Document Package Choices with Justification
- [ ] Pin Package Versions with Caret Constraints
- [ ] Integration needs mapped to package categories
- [ ] Licensing and maintenance guarantees reviewed
- [ ] Packages evaluated for maintenance and compatibility
- [ ] Assess licensing and maintenance guarantees
- [ ] Check package documentation for Laravel conventions
- [ ] Choose packages that follow Laravel conventions and are well-maintained

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Assess licensing and maintenance guarantees
- [ ] Check package documentation for Laravel conventions
- [ ] Choose packages that follow Laravel conventions and are well-maintained
- [ ] Evaluate packages: GitHub stars, maintenance, Laravel version compatibility
- [ ] Evaluate test coverage and community support
- [ ] Identify integration needs: HTTP client, webhooks, rate limiting, monitoring
- [ ] Key packages:
- [ ] Add Circuit Breaker for All External API Calls
- [ ] Choose Managed Gateway Only for 10K+ Daily Webhooks
- [ ] Default to Saloon + Spatie for New Integrations
- [ ] Document Package Choices with Justification
- [ ] Pin Package Versions with Caret Constraints

---

# Performance Checklist

- [ ] Circuit breaker state check: ~1-5ms (Redis)
- [ ] Each added middleware layer: ~0.5-2ms
- [ ] Idempotency check: ~2-5ms (cache + lock)
- [ ] Saloon overhead: ~1-3ms per request vs Http facade
- [ ] Spatie webhook processing: ~5-10ms before queue job
- [ ] Vendor SDK overhead varies widely (2-20ms)

---

# Security Checklist

- [ ] API keys stored in packages must use Laravel config + .env, never hardcoded
- [ ] Circuit breaker state is security-sensitive â€” prevent reset via unauthenticated endpoints
- [ ] Idempotency keys can be brute-forced if predictable â€” use UUID v4 or secure random
- [ ] Package transitive dependencies can introduce vulnerabilities â€” audit regularly
- [ ] Webhook signature verification prevents spoofed events â€” always verify, never skip in dev mode

---

# Reliability Checklist

- [ ] Choosing managed webhook gateway too early â€” self-hosted Spatie handles 10K/day easily
- [ ] Ignoring composer.json conflicts â€” test `composer update` before merging
- [ ] No circuit breaker on queue jobs â€” workers grind to a halt on external failure
- [ ] Not pinning versions â€” automatic minor updates can introduce breaking changes
- [ ] Using five packages when three suffice â€” evaluate overlap before installing
- [ ] Vendor SDK wrapper overkill â€” wrapping Stripe PHP SDK in Saloon adds no value
- [ ] Add Circuit Breaker for All External API Calls

---

# Testing Checklist

- [ ] `composer audit` shows zero vulnerabilities
- [ ] All package versions are compatible with the project's Laravel version
- [ ] Circuit breaker implemented for all external API calls (sync and queue)
- [ ] composer.json has appropriate version constraints (pinned, not floating)
- [ ] Idempotency applied to all non-idempotent HTTP methods (POST, PATCH)
- [ ] Integration needs mapped to package categories
- [ ] Licensing and maintenance guarantees reviewed
- [ ] Migration path documented for each critical package
- [ ] Package health has been verified (recent commits, active maintenance)
- [ ] Package selection documented with rationale (architecture decision record)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Package Sprawl â€” Installing More Packages Than Needed]
- [ ] [Abandonware Dependence â€” Critical Integration on Unmaintained Package]
- [ ] [Over-Abstraction â€” Wrapping Every Vendor SDK in Custom Connector]
- [ ] [Vendor SDK Lock-In â€” Package That Doesn't Support Laravel Patterns]
- [ ] [Migration Aversion â€” Staying on Outdated Package Versions]
- [ ] [No Version Pinning â€” Floating Dependencies Break Unexpectedly]
- [ ] [Ignoring Dependency Vulnerability Audits]
- [ ] [Premature Managed Gateway Adoption]
- [ ] Abandonware Dependence:
- [ ] Migration Aversion:
- [ ] Over-Abstraction:
- [ ] Package Sprawl:
- [ ] Vendor SDK Lock-in:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


