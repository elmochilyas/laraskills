# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** channel-authorization-routes-channels-php
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `Broadcast::routes()` is called in the application
- [ ] All private and presence channel patterns have corresponding auth callbacks
- [ ] Auth callbacks return correct truthy/falsy values for authorized/unauthorized users
- [ ] Always Add ->where() Constraints to Disambiguate Overlapping Patterns
- [ ] Always Delegate Complex Authorization to Gates or Policies
- [ ] Always Register Broadcast::routes() with Proper Middleware
- [ ] Always Use Wildcard Parameters in Channel Patterns
- [ ] Design
- [ ] `Broadcast::routes()` registered with auth and throttle middleware
- [ ] All private and presence channel patterns have corresponding auth callbacks
- [ ] Channel patterns use `{param}` wildcards (not hardcoded names)
- [ ] Add `->where()` regex constraints to disambiguate overlapping patterns
- [ ] Define channel patterns in `routes/channels.php` using `Broadcast::channel()`
- [ ] Delegate complex authorization logic to Gates or Policies
- [ ] API clients authenticate correctly via token-based guards
- [ ] Authorized users can subscribe to private/presence channels
- [ ] No overlapping patterns cause authorization bypass

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `->where()` regex constraints to disambiguate overlapping patterns
- [ ] Define channel patterns in `routes/channels.php` using `Broadcast::channel()`
- [ ] Delegate complex authorization logic to Gates or Policies
- [ ] Ensure `Broadcast::routes()` is called with auth and rate-limit middleware
- [ ] For presence channels, return an array with at minimum `id` and `name`
- [ ] Specify `['guards' => ['sanctum', 'web']]` for multi-guard support
- [ ] Test authorization success and failure for each channel pattern
- [ ] Use `{param}` wildcards in channel names for parameterization
- [ ] Verify auth callback truthiness: authorized = truthy, unauthorized = falsy
- [ ] Write authorization callbacks that return truthy for authorized access
- [ ] Always Add ->where() Constraints to Disambiguate Overlapping Patterns
- [ ] Always Delegate Complex Authorization to Gates or Policies

---

# Performance Checklist

- [ ] Auth endpoint should be fast (<50ms typical); database queries in callbacks add latency for every subscription
- [ ] Model route-model binding adds a database query per auth request
- [ ] No built-in caching; developers must implement caching manually for repeated authorizations
- [ ] Reconnection storms trigger mass auth requestsâ€”optimize callbacks aggressively
- [ ] Use simple ID comparisons where possible; avoid complex permission checks in hot auth paths
- [ ] Each database query in a callback adds latency; use cached lookups for repeated checks

---

# Security Checklist

- [ ] Callback exceptions result in 500 errors, blocking all subscriptions to that channel pattern
- [ ] Guard misconfiguration causes all private channel subscriptions to fail silently
- [ ] Pattern conflicts (e.g., `orders.{id}` and `orders.{slug}` both matching the same channel) can cause authorization bypass
- [ ] Session expiry between page load and auth call results in failed subscription despite valid credentials
- [ ] Unmatched channel patterns result in a 403â€”not a 404â€”to avoid channel name enumeration
- [ ] Auth callbacks execute on every subscriptionâ€”keep them fast (<50ms)
- [ ] Presence callbacks return data visible to all membersâ€”never return PII
- [ ] Returning `true` unconditionally bypasses authorization entirelyâ€”never do this

---

# Reliability Checklist

- [ ] 403 on all private subscriptions
- [ ] API clients get 401
- [ ] Auth endpoint 404
- [ ] Presence channel shows no user data
- [ ] Wrong users authorized
- [ ] Always Add ->where() Constraints to Disambiguate Overlapping Patterns
- [ ] Always Delegate Complex Authorization to Gates or Policies
- [ ] Always Register Broadcast::routes() with Proper Middleware
- [ ] Always Use Wildcard Parameters in Channel Patterns
- [ ] Never Return the Entire User Model from Presence Auth Callbacks

---

# Testing Checklist

- [ ] `Broadcast::routes()` is called in the application
- [ ] `Broadcast::routes()` registered with auth and throttle middleware
- [ ] All private and presence channel patterns have corresponding auth callbacks
- [ ] API clients authenticate correctly via token-based guards
- [ ] Auth callbacks return correct truthy/falsy values for authorized/unauthorized users
- [ ] Authorized users can subscribe to private/presence channels
- [ ] Channel patterns use `{param}` wildcards (not hardcoded names)
- [ ] Complex authorization delegated to Gates/ Policies
- [ ] Custom guards resolve users correctly for API-driven requests
- [ ] Custom guards specified for non-session authentication

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Monolithic Auth Callback]
- [ ] [Returning true Unconditionally]
- [ ] [Database Queries in Every Auth Callback]
- [ ] [Auth Callback in Web Routes File]
- [ ] [No Rate Limiting on Broadcast::routes()]
- [ ] Auth callback in web routes file
- [ ] Database queries in every callback
- [ ] Monolithic auth callback
- [ ] Returning `true` unconditionally

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


