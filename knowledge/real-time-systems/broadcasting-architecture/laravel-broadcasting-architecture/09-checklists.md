# Metadata

**Domain:** real-time-systems
**Subdomain:** broadcasting-architecture
**Knowledge Unit:** laravel-broadcasting-architecture
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `allowed_origins` is configured for WebSocket server
- [ ] `Broadcast::routes()` is registered with appropriate middleware
- [ ] `toOthers()` sender exclusion works correctly
- [ ] Always Apply Auth Middleware and Rate Limiting to Broadcast::routes()
- [ ] Always Override broadcastWith() to Control Payload
- [ ] Always Run a Queue Worker for Broadcast Events
- [ ] Always Use toOthers() with X-Socket-ID for Sender Exclusion
- [ ] Configure a Dedicated Queue Connection for Broadcasts
- [ ] `allowed_origins` is a non-empty array in production
- [ ] `Broadcast::routes()` has auth middleware applied
- [ ] `BROADCAST_CONNECTION` is correctly set (not `log` or `null` in production)
- [ ] Configure `config/broadcasting.php` with driver-specific options
- [ ] Configure Echo on the frontend with matching broadcaster and credentials
- [ ] Create event classes implementing `ShouldBroadcast` with `broadcastOn()`
- [ ] All private/presence channels enforce authorization correctly
- [ ] Auth endpoint responds <50ms under normal load
- [ ] Echo client receives real-time events on subscribed channels

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `config/broadcasting.php` with driver-specific options
- [ ] Configure Echo on the frontend with matching broadcaster and credentials
- [ ] Create event classes implementing `ShouldBroadcast` with `broadcastOn()`
- [ ] Define channel authorization callbacks for private and presence channels
- [ ] Ensure a queue worker is running (`php artisan queue:work`)
- [ ] Register `Broadcast::routes()` with auth and rate-limit middleware in `routes/channels.php`
- [ ] Run `php artisan install:broadcasting` to scaffold configuration
- [ ] Set `allowed_origins` in Reverb config for CSWSH prevention
- [ ] Set `BROADCAST_CONNECTION` and driver credentials in `.env`
- [ ] Verify: dispatch a test event and confirm client receives it
- [ ] Always Apply Auth Middleware and Rate Limiting to Broadcast::routes()
- [ ] Always Override broadcastWith() to Control Payload

---

# Performance Checklist

- [ ] `ShouldBroadcastNow` bypasses queueâ€”use only for latency-critical events
- [ ] `sync` queue driver for broadcasting negates performance benefit; development only
- [ ] Dedicated queue connection for broadcasts prevents other job types from starving throughput
- [ ] Event payload size directly impacts serialization and network transfer
- [ ] Queue worker count must match broadcast dispatch volume
- [ ] `broadcastWith()` controls payload to avoid leaking sensitive model data
- [ ] Auth endpoint must be rate-limited to prevent abuse during reconnection storms
- [ ] Dedicated queue connection prevents broadcast backlog from starving other jobs

---

# Security Checklist

- [ ] Auth endpoint must be rate-limited to prevent abuse
- [ ] Configure `Broadcast::routes()` with proper middleware (auth guards, rate limiting)
- [ ] Implement `ShouldRescue` on events to prevent broadcast failures from surfacing to users
- [ ] Set `allowed_origins` in Reverb config to prevent unauthorized domain connections
- [ ] Use `after_commit` or `ShouldDispatchAfterCommit` for transactional consistency
- [ ] Auth endpoint must be rate-limited to prevent abuse during reconnection storms

---

# Reliability Checklist

- [ ] Auth endpoint returns 404
- [ ] Echo connection fails
- [ ] Events never received by clients
- [ ] Private channel subscriptions fail
- [ ] Always Apply Auth Middleware and Rate Limiting to Broadcast::routes()
- [ ] Always Override broadcastWith() to Control Payload
- [ ] Always Run a Queue Worker for Broadcast Events
- [ ] Always Use toOthers() with X-Socket-ID for Sender Exclusion
- [ ] Never Broadcast on Public Channels for User-Specific Data
- [ ] Never Use ShouldBroadcastNow as the Default for All Events

---

# Testing Checklist

- [ ] `allowed_origins` is a non-empty array in production
- [ ] `allowed_origins` is configured for WebSocket server
- [ ] `Broadcast::routes()` has auth middleware applied
- [ ] `Broadcast::routes()` is registered with appropriate middleware
- [ ] `BROADCAST_CONNECTION` is correctly set (not `log` or `null` in production)
- [ ] `toOthers()` sender exclusion works correctly
- [ ] All private/presence channels enforce authorization correctly
- [ ] Auth endpoint responds <50ms under normal load
- [ ] Broadcast events use `ShouldBroadcast` interface
- [ ] Broadcasting driver is correctly configured in `config/broadcasting.php`

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Synchronous Broadcasting for All Events]
- [ ] [No Queue Worker Running for Broadcasts]
- [ ] [Shared Queue Connection With Other Job Types]
- [ ] [Hardcoded Broadcast Driver in Application Code]
- [ ] [No Auth Middleware on Broadcast::routes()]
- [ ] Hardcoded broadcast driver in code
- [ ] Mixing broadcast and non-broadcast queue jobs
- [ ] No queue worker monitoring
- [ ] Synchronous broadcasting for all events

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Dedicated queue connection prevents broadcast backlog from starving other jobs

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


