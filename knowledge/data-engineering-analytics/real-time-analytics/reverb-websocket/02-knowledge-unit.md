# Reverb WebSocket

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** reverb-websocket
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Reverb is a first-party, self-hosted WebSocket server for Laravel broadcasting, built on ReactPHP — it replaces third-party services like Pusher with a native PHP WebSocket server that integrates directly with Laravel's event broadcasting system via `ShouldBroadcast` and Laravel Echo. Reverb enables real-time features — live dashboards, notifications, presence channels — without external dependencies.

---

## Core Concepts

- **Broadcasting System:** Allows server-side events to be pushed to connected clients over WebSocket — events implement `ShouldBroadcast` and define which channel they should be broadcast on
- **Reverb Server:** Standalone PHP process (started with `php artisan reverb:start`) — accepts WebSocket connections, handles channel subscriptions, broadcasts events — built on ReactPHP's event loop
- **Channels:** Message routing endpoints — Public (anyone can subscribe), Private (require authentication), Presence (track who is connected)
- **Echo:** JavaScript library providing clean API for subscribing to channels and listening for events on the client side

---

## Mental Models

- **Reverb as Radio Station:** The Reverb server is the radio station transmitter. The application creates broadcasts (ShouldBroadcast events) like radio show segments. Echo is the radio receiver in users' browsers. Channels are radio frequencies — some are public (FM 100), some are private (encrypted signal).
- **Broadcasting as Town Crier:** The Laravel application is the town crier (ShouldBroadcast), Reverb is the bell that rings to get attention, Echo is the ears of the townspeople. The crier says "Revenue updated!" on a specific street (channel), and only people on that street hear it.

---

## Internal Mechanics

When a `ShouldBroadcast` event is dispatched, Laravel serializes the event and pushes it to the queue. The queue worker processes the broadcast and sends the message to Redis pub/sub. Reverb instances subscribed to the Redis channel receive the message and look up which local WebSocket connections are subscribed to the target channel. The message is then sent over the WebSocket connection to the client's Echo listener. The flow: Event triggered → ShouldBroadcast → queue → Redis pub/sub → Reverb server → WebSocket → Echo client.

---

## Patterns

- **Use Private Channels for Authenticated Data:** Dashboard analytics data should use private channels with authorization — never broadcast sensitive data on public channels
- **Scale with Redis Backbone:** For production deployments with 10K+ connections, use multiple Reverb instances with shared Redis pub/sub backbone
- **Descriptive Channel Naming:** Use hierarchical channel names: `analytics.dashboard.{dashboard_id}.revenue` — enables granular authorization and event routing

---

## Architectural Decisions

Use Reverb for live dashboards with real-time metric updates, notifications that appear without page refresh, and collaborative features (presence awareness). Do not use for server-to-server event streaming (use queues or Kafka) or background job processing. Always use private channels for authenticated analytics data. Monitor connection count and plan scaling when approaching limits.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| No third-party dependency | Self-hosted infrastructure | Must manage Reverb server processes |
| Full control over broadcasting | Requires PHP process management (Supervisor) | `php artisan reverb:start` managed by process monitor |
| Scalable to 100K+ connections | Scaling requires Redis backbone | Additional Redis instance for pub/sub |
| Native Laravel integration | New connection type to monitor | WebSocket metrics added to monitoring stack |

---

## Performance Considerations

Single Reverb instance handles 10K-50K concurrent connections. Memory usage: ~1MB per 1000 connections for idle connections. Broadcast throughput: 10K-100K messages/second per instance. Main bottleneck is Redis pub/sub for horizontal scaling.

---

## Production Considerations

Private channels require authentication via `broadcast/auth` endpoint — implement authorization logic. Presence channels expose user information — verify what data is shared. Reverb should run behind a reverse proxy (Nginx) with TLS termination. Rate limit broadcast events to prevent abuse. Use DTOs or resource classes to control what data is broadcast — never broadcast raw Eloquent models.

---

## Common Mistakes

- **Broadcasting on Public Channels:** Dashboard analytics data broadcast on public channels — any user can subscribe and see all metrics. Better: always use private channels with authorization.
- **No Horizontal Scaling Plan:** Reverb deployed on single server — connection count grows and server runs out of file descriptors — users disconnected. Better: plan for horizontal scaling from the start.
- **Broadcasting Raw Data:** Eloquent models broadcast directly — serialization exposes internal field names and potentially sensitive data. Better: use DTOs or resource classes.

---

## Failure Modes

- **WebSocket Connection Limit:** OS file descriptor limit reached — new connections rejected, existing connections may be dropped. Mitigation: increase file descriptor limits, plan scaling before reaching limits.
- **Queue Backlog for Broadcasts:** Queue worker cannot keep up with broadcast dispatch rate — broadcast messages delayed, dashboards show stale data. Mitigation: use dedicated queue for broadcasts, monitor queue depth.
- **Redis Pub/Sub Message Loss:** Redis pub/sub has no message persistence — if subscriber is not connected, message is lost. Mitigation: Reverb instances must maintain persistent Redis subscription.

---

## Ecosystem Usage

Reverb is a core Laravel package requiring no third-party services. It integrates with Laravel's existing broadcasting system — any `ShouldBroadcast` event automatically works with Reverb. Laravel Echo is the client-side library. The `laravel-echo` npm package connects to Reverb from JavaScript. Broadcasting configuration in `config/broadcasting.php` selects `reverb` as the driver.

---

## Related Knowledge Units

### Prerequisites
- Laravel Broadcasting Fundamentals — ShouldBroadcast, channels, events
- Laravel Echo — Client-side WebSocket subscription

### Related Topics
- Reverb Scaling — Horizontal scaling with shared Redis backbone
- Custom Reverb Driver — Extending Reverb with custom broadcasting drivers

### Advanced Follow-up Topics
- ClickHouse Materialized Views — Backend analytics computation feeding broadcasts
- Queue Dispatching — Queue-based broadcast dispatch flow

---

## Research Notes

Reverb represents Laravel's move toward first-party, self-hosted real-time infrastructure. By replacing third-party services like Pusher with a native PHP WebSocket server, Reverb eliminates external dependencies and gives developers full control over broadcasting infrastructure. The architecture scales from a single server to horizontally clustered deployments, making it suitable for applications of any size.
