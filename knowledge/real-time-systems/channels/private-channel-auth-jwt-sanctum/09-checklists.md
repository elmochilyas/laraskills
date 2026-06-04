# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** private-channel-auth-jwt-sanctum
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] CORS is configured for the auth endpoint if cross-origin
- [ ] CSRF token is included for Sanctum SPA auth requests
- [ ] Echo `auth.headers` sends proper Authorization header
- [ ] Always Implement Token Refresh for Long-Lived Echo Connections
- [ ] Always Include Accept: application/json in Auth Headers
- [ ] Always Specify the guards Option for Non-Session Auth
- [ ] Always Use Multi-Guard Channels for Hybrid Session + API Applications
- [ ] Never Expose Bearer Tokens in Client-Side Build Artifacts
- [ ] `Accept: application/json` header included
- [ ] CORS configured for auth endpoint if cross-origin
- [ ] Echo `auth.headers` sends proper Authorization header
- [ ] Add `['guards' => ['sanctum', 'web']]` to `Broadcast::channel()` definitions for multi-guard support
- [ ] Avoid `auth:api` middleware on `Broadcast::routes()`â€”let guard resolution handle authentication
- [ ] Configure Echo with `authEndpoint` and `auth: { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } }`
- [ ] API clients (mobile, SPA) authenticate successfully via token-based guards
- [ ] No tokens leaked in client-side build artifacts
- [ ] Session-based web clients continue to work on same channels

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `['guards' => ['sanctum', 'web']]` to `Broadcast::channel()` definitions for multi-guard support
- [ ] Avoid `auth:api` middleware on `Broadcast::routes()`â€”let guard resolution handle authentication
- [ ] Configure Echo with `authEndpoint` and `auth: { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } }`
- [ ] For Sanctum SPA auth: ensure CSRF token is included and `STATE_DOMAIN` is configured
- [ ] Implement token refresh mechanism for long-lived Echo connections
- [ ] Include `Accept: application/json` header for proper JSON error responses
- [ ] Monitor auth failures per guard type
- [ ] Store tokens in runtime storage (not hardcoded in source)â€”read from `localStorage` or secure storage
- [ ] Test auth with all supported guard types before production deployment
- [ ] Use multi-guard channels for hybrid applications serving both web and API clients
- [ ] Always Implement Token Refresh for Long-Lived Echo Connections
- [ ] Always Include Accept: application/json in Auth Headers

---

# Performance Checklist

- [ ] Auth caching middleware can reduce repeated guard resolution for the same user
- [ ] JWT validation is stateless (no database query) but requires cryptographic verification
- [ ] Passport token validation requires OAuth server round-trip or cached token scopes
- [ ] Sanctum token lookup queries the `personal_access_tokens` database table
- [ ] Token validation executes on every subscription (no built-in auth caching)
- [ ] Token validation executes on every subscriptionâ€”no built-in auth caching

---

# Security Checklist

- [ ] Bearer tokens in client-side JavaScript are accessible via XSSâ€”use short-lived tokens
- [ ] CSRF token validation required for Sanctum SPA authentication POST requests
- [ ] Exposing tokens in environment variables baked into JS bundles is a common leak vector
- [ ] The auth endpoint must accept `Accept: application/json` header for proper error responses
- [ ] Token expiration requires client-side refresh handling to maintain WebSocket authentication
- [ ] Bearer tokens in client-side JS are accessible via XSSâ€”use short-lived tokens
- [ ] Never hardcode tokens in source code or environment variables baked into JS bundles
- [ ] Sanctum token lookup queries `personal_access_tokens` table

---

# Reliability Checklist

- [ ] API clients get 401 on auth endpoint
- [ ] Auth returns HTML instead of JSON
- [ ] Reconnection fails after token expiry
- [ ] Sanctum SPA auth fails
- [ ] Token visible in source maps
- [ ] Always Implement Token Refresh for Long-Lived Echo Connections
- [ ] Always Include Accept: application/json in Auth Headers
- [ ] Always Specify the guards Option for Non-Session Auth
- [ ] Always Use Multi-Guard Channels for Hybrid Session + API Applications
- [ ] Never Expose Bearer Tokens in Client-Side Build Artifacts

---

# Testing Checklist

- [ ] `Accept: application/json` header included
- [ ] API clients (mobile, SPA) authenticate successfully via token-based guards
- [ ] CORS configured for auth endpoint if cross-origin
- [ ] CORS is configured for the auth endpoint if cross-origin
- [ ] CSRF token is included for Sanctum SPA auth requests
- [ ] Echo `auth.headers` sends proper Authorization header
- [ ] Multi-guard channels work for both session and token users
- [ ] No tokens exposed in client-side build artifacts
- [ ] No tokens leaked in client-side build artifacts
- [ ] Sanctum/Passport guard resolves users correctly in auth callback

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using Default web Guard for API-Driven Apps]
- [ ] [Hardcoded Tokens in Echo JavaScript Config]
- [ ] [No Multi-Guard Configuration]
- [ ] [Ignoring Accept: application/json Header]
- [ ] [Tokens Expiring Without Refresh During Session]
- [ ] Hardcoded tokens in Echo config
- [ ] Ignoring CORS for auth endpoint
- [ ] Single guard for all contexts

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


