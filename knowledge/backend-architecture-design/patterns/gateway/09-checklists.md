# Gateway patterns — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Gateway
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Adapter pattern
- [ ] Know Data Source patterns (Table Data Gateway, Row Data Gateway)
- [ ] Familiar with external system integration patterns

## Implementation Checklist
- [ ] Gateway encapsulates access to external system or resource
- [ ] Gateway interface defined in application/domain layer
- [ ] Gateway implementation in infrastructure layer
- [ ] External system types not exposed in gateway interface
- [ ] Failures handled at gateway level (not propagated raw)
- [ ] Gateway is single-responsibility (data access only)

## Verification Checklist
- [ ] Gateway can be mocked in tests (interface-based)
- [ ] External system changes only affect gateway implementation
- [ ] No business logic in gateway methods
- [ ] Return types adapted to application domain (not vendor types)
- [ ] Gateway handles errors appropriately (timeouts, retries, circuit breaker)

## Security Checklist
- [ ] Credentials and secrets managed securely (env, vault)
- [ ] Anti-corruption layer prevents third-party vulnerabilities from propagating
- [ ] Input validated at domain boundaries
- [ ] Gateway doesn't log sensitive data

## Performance Checklist
- [ ] Gateway delegation overhead is negligible
- [ ] Service Gateway: network latency is dominant cost
- [ ] Caching layer considered for repeated access patterns
- [ ] Connection pooling for database gateways

## Production Readiness Checklist
- [ ] Gateway has timeout configuration
- [ ] Retry strategy implemented for transient failures
- [ ] Circuit breaker pattern considered for unstable external services
- [ ] Monitoring on gateway call volume and failures

## Common Mistakes to Avoid
- [ ] Gateway with business logic (mixes data access and domain rules)
- [ ] Gateway exposing external system types in its interface (leaky abstraction)
- [ ] Gateway that doesn't handle failures (exceptions propagate raw)
- [ ] One giant gateway for all external access (SRP violation)
- [ ] Gateway without interface (can't mock in tests)
