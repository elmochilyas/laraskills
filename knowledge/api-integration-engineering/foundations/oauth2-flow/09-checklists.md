# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** oauth2-flow
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] 401 response triggers single retry with fresh token
- [ ] Cache stampede protection (lock/mutex)
- [ ] Proactive refresh at 50% TTL
- [ ] Cache Tokens with Stampede Protection
- [ ] Handle 401 with Single Retry and Fresh Token
- [ ] Inject Token Service as Singleton
- [ ] Proactively Refresh at 50% TTL
- [ ] Store Secrets in Vault, Not .env
- [ ] Automatic token refresh on expiry
- [ ] Client credentials stored securely in `.env`
- [ ] No credentials in version control
- [ ] Attach token to API requests: `Authorization: Bearer {token}`
- [ ] Cache token in cache driver with TTL matching token expiry
- [ ] Handle token endpoint errors with retry logic

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Attach token to API requests: `Authorization: Bearer {token}`
- [ ] Cache token in cache driver with TTL matching token expiry
- [ ] Handle token endpoint errors with retry logic
- [ ] Implement automatic token refresh when expired
- [ ] Log token acquisition and refresh events
- [ ] Request access token: POST to token endpoint with `grant_type=client_credentials`
- [ ] Store client credentials securely in `.env` (not hardcoded)
- [ ] Use SaloonPHP OAuth2 plugin or custom connector for token management
- [ ] Cache Tokens with Stampede Protection
- [ ] Handle 401 with Single Retry and Fresh Token
- [ ] Inject Token Service as Singleton
- [ ] Proactively Refresh at 50% TTL

---

# Performance Checklist

- [ ] Decode JWT locally to inspect expiry without API call
- [ ] Lock-based cache stampede protection adds ~1ms per lock acquisition
- [ ] Token caching eliminates repeated auth requests
- [ ] Token request adds one round-trip per authentication

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Cache stampede when multiple concurrent requests all fetch at expiry
- [ ] Fetching token on every request (missing cache)
- [ ] Ignoring scope differences between environments
- [ ] Not handling expired 401 responses in middleware
- [ ] Storing secrets in version control or plain .env
- [ ] Handle 401 with Single Retry and Fresh Token

---

# Testing Checklist

- [ ] 401 response triggers single retry with fresh token
- [ ] Automatic token refresh on expiry
- [ ] Cache stampede protection (lock/mutex)
- [ ] Client credentials stored securely in `.env`
- [ ] No credentials in version control
- [ ] Proactive refresh at 50% TTL
- [ ] Secrets stored in vault, not source code
- [ ] Token acquisition logged for audit
- [ ] Token cached with expiry-based invalidation
- [ ] Token cached with TTL relative to token expiry

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Fetching OAuth Token on Every Request (No Caching)]
- [ ] [No Cache Stampede Protection on Token Refresh]
- [ ] [Not Handling 401 Responses with Token Retry]
- [ ] [Credentials Stored in Source Code or .env Without Vault]
- [ ] [No Proactive Token Refresh (Waiting Until Expiry)]

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


