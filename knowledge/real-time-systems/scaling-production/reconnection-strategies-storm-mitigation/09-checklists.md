# Metadata

**Domain:** real-time-systems
**Subdomain:** scaling-production
**Knowledge Unit:** reconnection-strategies-storm-mitigation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `/broadcasting/auth` rate limited with throttle middleware
- [ ] `max_connections_per_ip` set in Reverb config
- [ ] Auth caches pre-warmed before planned deployments
- [ ] Always Apply throttle Middleware to the Auth Endpoint
- [ ] Always Configure max_connections_per_ip in Reverb
- [ ] Always Implement a Circuit Breaker for Auth Endpoint Errors
- [ ] Always Implement Jitter with Exponential Backoff
- [ ] Always Pre-Warm Authorization Caches Before Planned Deployments
- [ ] `/broadcasting/auth` rate limited (throttle middleware)
- [ ] `max_connections_per_ip` set in Reverb config
- [ ] Auth caches pre-warmed before planned deployments
- [ ] Apply `throttle` middleware to `/broadcasting/auth` (e.g., 100 requests per minute)
- [ ] Configure Echo with `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- [ ] Configure rolling deployments: restart Reverb instances one at a time
- [ ] Auth endpoint stays responsive during reconnection storm
- [ ] Reconnection after outage spreads across 30-60s window (not simultaneous)
- [ ] Rolling deployments cause no full-service disruption

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply `throttle` middleware to `/broadcasting/auth` (e.g., 100 requests per minute)
- [ ] Configure Echo with `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- [ ] Configure rolling deployments: restart Reverb instances one at a time
- [ ] Implement circuit breaker: increase backoff multiplier on 429/503
- [ ] Implement full jitter on client reconnect: `Math.random() * Math.min(cap, base * 2^n)`
- [ ] Monitor auth endpoint response times and error rates
- [ ] Pre-warm authorization caches before planned deployments
- [ ] Set `max_connections_per_ip` in Reverb config (e.g., 100)
- [ ] Set Supervisor `stopwaitsecs` to match or exceed `activity_timeout`
- [ ] Test storm scenario: stop Redis and verify recovery after restart
- [ ] Always Apply throttle Middleware to the Auth Endpoint
- [ ] Always Configure max_connections_per_ip in Reverb

---

# Performance Checklist

- [ ] Auth endpoint throughput determines maximum sustainable reconnect rate
- [ ] Database connection pool must accommodate auth callback queries during the storm
- [ ] PHP-FPM process pool must be sized to handle auth storm plus normal HTTP traffic
- [ ] Queue workers must handle the broadcast event backlog accumulated during the outage
- [ ] Redis pub/sub may buffer events published during the reconnection window
- [ ] `max_connections_per_ip` prevents individual IP abuse and limits storm impact from single source
- [ ] Auth endpoint throughput determines max sustainable reconnect rate
- [ ] PHP-FPM must handle auth storm + normal HTTP traffic concurrently

---

# Security Checklist

- [ ] `max_connections_per_ip` prevents individual IP abuse and limits storm impact from a single source
- [ ] Aggressive rate limiting may reject legitimate reconnect attemptsâ€”tune thresholds carefully
- [ ] Circuit breaker patterns prevent auth endpoint from being overwhelmed by retries
- [ ] Rate limiting on the auth endpoint prevents DoS during reconnection storms
- [ ] Auth endpoint throughput determines max sustainable reconnect rate
- [ ] PHP-FPM must handle auth storm + normal HTTP traffic concurrently

---

# Reliability Checklist

- [ ] Auth database overload during reconnection
- [ ] Auth endpoint collapses under reconnect
- [ ] Clients reconnect in synchronized waves
- [ ] Connection storm on every deployment
- [ ] Connections killed without graceful drain
- [ ] Always Apply throttle Middleware to the Auth Endpoint
- [ ] Always Configure max_connections_per_ip in Reverb
- [ ] Always Implement a Circuit Breaker for Auth Endpoint Errors
- [ ] Always Implement Jitter with Exponential Backoff
- [ ] Always Pre-Warm Authorization Caches Before Planned Deployments

---

# Testing Checklist

- [ ] `/broadcasting/auth` rate limited (throttle middleware)
- [ ] `/broadcasting/auth` rate limited with throttle middleware
- [ ] `max_connections_per_ip` set in Reverb config
- [ ] Auth caches pre-warmed before planned deployments
- [ ] Auth endpoint stays responsive during reconnection storm
- [ ] Circuit breaker implemented for 429/503 responses
- [ ] Circuit breaker pattern implemented for auth endpoint 429/503 responses
- [ ] Echo configured with `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- [ ] Echo configured with explicit reconnection options (activityTimeout, pongTimeout, unavailableTimeout)
- [ ] Full jitter implemented: `Math.random() * backoffValue`

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Exponential Backoff Without Jitter (Synchronized Retry Waves)]
- [ ] [No Rate Limiting on Auth Endpoint]
- [ ] [Simultaneous Restart of All WebSocket Instances]
- [ ] [No Cache Pre-Warming Before Deployments]
- [ ] [No Circuit Breaker for Auth Endpoint Errors]
- [ ] Infinite reconnect loop
- [ ] Load balancer snowball
- [ ] Thundering herd at auth

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Queue workers must process broadcast event backlog accumulated during outage

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


