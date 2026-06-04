# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** reverb-websocket
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Reverb WebSocket server installed and running as first-party Pusher replacement
- [ ] ShouldBroadcast events defined for real-time analytics data (dashboard updates, notifications)
- [ ] Laravel Echo configured on client side to subscribe to channels
- [ ] Channel types selected (public, private, presence) per use case
- [ ] Reverb server scaling understood (K027) ready for production load
- [ ] Echo client reconnection strategy configured for resilience

---

# Architecture Checklist

- [ ] ShouldBroadcast interface applied to event classes for real-time broadcast
- [ ] Reverb server replaces Pusher SDK — no external service dependency
- [ ] Channels scoped by analytics domain (orders.updates, dashboard.metrics.tenant_id)
- [ ] Private channels for user-specific analytics notifications
- [ ] Presence channels for collaborative dashboard features (who is viewing)
- [ ] Database-driven broadcasting evaluated for non-realtime fallback

---

# Implementation Checklist

- [ ] Reverb installed via composer: laravel/reverb
- [ ] Reverb server started: php artisan reverb:start
- [ ] Event class: shouldBroadcastTo('orders-channel'), broadcastOn(new PrivateChannel('orders.{id}'))
- [ ] Echo client: Echo.channel('orders-channel').listen('OrderShipped', callback)
- [ ] Echo connector configured in resources/js/bootstrap.js with authEndpoint
- [ ] Nginx reverse proxy configured for WebSocket upgrade

---

# Performance Checklist

- [ ] WebSocket connection count monitored per Reverb instance
- [ ] Message throughput (events/second) measured for broadcast capacity
- [ ] Payload size minimized — only needed fields in event broadcast
- [ ] Private channel authorization endpoint response time < 50ms
- [ ] Presence channel join/leave events not overwhelming for large rooms
- [ ] Reverb horizontal scaling (K027) configured when single instance limit reached

---

# Security Checklist

- [ ] WebSocket connections authenticated via token (Laravel Echo auth endpoint)
- [ ] Private/presence channel authorization prevents unauthorized subscription
- [ ] Reverb app credentials in environment config (REVERB_APP_SECRET)
- [ ] Presence channel user information sanitized — no PII in user data
- [ ] CORS origins whitelisted in config/reverb.php

---

# Reliability Checklist

- [ ] Echo reconnection with exponential backoff configured for connection drops
- [ ] Reverb server restart does not lose messages (Redis persistence or in-memory queue)
- [ ] Client state recovery after reconnect — re-subscribes to channels
- [ ] Graceful broadcast failure — broadcast exception does not crash application
- [ ] Database driver fallback for events when WebSocket unavailable

---

# Testing Checklist

- [ ] Test ShouldBroadcast event fires and reaches Echo subscriber
- [ ] Test private channel authorization blocks unauthorized users
- [ ] Test presence channel shows correct user list on join/leave
- [ ] Test Echo reconnects after Reverb server restart
- [ ] Test broadcast payload reaches all subscribers on channel
- [ ] Test database driver fallback delivers event without broadcast

---

# Maintainability Checklist

- [ ] Broadcast events in app/Events/ directory with descriptive names
- [ ] Channel naming convention documented (domain.resource.action)
- [ ] Echo client code in dedicated module, not in layout template
- [ ] Reverb server configuration in config/reverb.php
- [ ] Broadcast event payload documented per event class

---

# Anti-Pattern Prevention Checklist

- [ ] Do not broadcast entire Eloquent models — broadcast DTOs or arrays
- [ ] Do not broadcast on public channels without rate limiting — prevents abuse
- [ ] Do not skip Echo reconnection strategy — connection drops are inevitable
- [ ] Do not broadcast sensitive data on public channels
- [ ] Do not use broadcasting for synchronous communication — broadcast is fire-and-forget

---

# Production Readiness Checklist

- [ ] Prometheus metrics for active connections, messages/second, authorization latency
- [ ] Logged warning when authorization endpoint latency exceeds 100ms
- [ ] Alert if Reverb process is not running
- [ ] WebSocket connection churn rate monitored (reconnections/second)
- [ ] Deploy checklist includes Reverb server start and Echo client config verification
- [ ] Staging Echo test validates end-to-end broadcast delivery

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: ShouldBroadcast events, channel types, Echo client, Reverb server
- [ ] Security requirements satisfied: token authentication, private channel authorization, CORS whitelist
- [ ] Performance requirements satisfied: connection count, throughput, payload size, auth endpoint speed
- [ ] Testing requirements satisfied: broadcast delivery, authorization, presence, reconnect, payload correctness
- [ ] Anti-pattern checks passed: DTOs not models, public channel rate limits, reconnect configured
- [ ] Production readiness verified: connection metrics, auth latency alerts, Reverb health, staging test

---

# Related References

- K027 (Reverb Scaling): Horizontal Reverb scaling with shared Redis backbone
- K041 (Custom Reverb Driver): Extending Reverb with custom broadcasting drivers
- K021 (OHLCV Candle Upsert): Real-time financial data broadcasting pattern
- K016 (ClickHouse Materialized Views): Backend analytics computation feeding real-time broadcasts
