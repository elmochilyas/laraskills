# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** reverb-websocket
**Difficulty:** Foundation
**Category:** Real-Time Communication
**Last Updated:** 2026-06-03

---

# Overview

Laravel Reverb is a first-party, self-hosted WebSocket server for Laravel broadcasting, built on ReactPHP. It replaces third-party services like Pusher with a native PHP WebSocket server that integrates directly with Laravel's event broadcasting system via `ShouldBroadcast` and Laravel Echo on the client side. Reverb enables real-time features — live dashboards, notifications, presence channels — without external dependencies.

Engineers must care because Reverb eliminates the cost and latency of third-party WebSocket services while providing full control over the broadcasting infrastructure. It scales from a single server to horizontally clustered deployments.

---

# Core Concepts

## Broadcasting System

Laravel's event broadcasting system allows server-side events to be pushed to connected clients over WebSocket. Events implement `ShouldBroadcast` and define which channel they should be broadcast on.

## Reverb Server

A standalone PHP process (started with `php artisan reverb:start`) that accepts WebSocket connections, handles channel subscriptions, and broadcasts events. Built on ReactPHP's event loop.

## Channels

Channels are message routing endpoints. Public channels can be subscribed by anyone. Private channels require authentication. Presence channels track who is connected.

## Echo

Laravel Echo is a JavaScript library that provides a clean API for subscribing to channels and listening for events on the client side.

---

# When To Use

- Live dashboards with real-time metric updates
- Notifications that appear without page refresh
- Collaborative features (who's online, presence awareness)
- Real-time analytics event streaming to browser clients
- Chat and messaging features

---

# When NOT To Use

- Server-to-server event streaming (use queues or Kafka)
- Background job processing (worker processes)
- Long-running data processing tasks
- High-frequency trading or sub-millisecond requirements

---

# Best Practices

## Use Private Channels for Authenticated Data

Dashboard analytics data should use private channels with authorization. Never broadcast sensitive data on public channels.

## Scale with Redis Backbone

For production deployments with 10K+ connections, use multiple Reverb instances with a shared Redis pub/sub backbone.

## Monitor Connection Count

Track active WebSocket connections. Set connection limits per Reverb instance. Plan scaling when approaching limits.

---

# Architecture Guidelines

## Data Flow

Event triggered → ShouldBroadcast → Laravel queue → Redis pub/sub → Reverb server → WebSocket → Echo client

## Channel Naming

Use descriptive, hierarchical channel names: `analytics.dashboard.{dashboard_id}.revenue`. This enables granular authorization and event routing.

## Presence Channels

Use presence channels for "who's viewing this dashboard" features. Presence channels automatically manage join/leave events.

---

# Performance Considerations

- Single Reverb instance handles 10K-50K concurrent connections.
- Memory usage: ~1MB per 1000 connections for idle connections.
- Broadcast throughput: 10K-100K messages/second per instance.
- Main bottleneck is Redis pub/sub for horizontal scaling.

---

# Security Considerations

- Private channels require authentication via `broadcast/auth` endpoint. Implement authorization logic.
- Presence channels expose user information. Verify what data is shared.
- Reverb should run behind a reverse proxy (Nginx) with TLS termination.
- Rate limit broadcast events to prevent abuse.

---

# Common Mistakes

## Mistake: Broadcasting on Public Channels

Dashboard analytics data is broadcast on public channels. Any user can subscribe and see all metrics.

**Better approach:** Always use private channels for authenticated data. Implement channel authorization.

## Mistake: No Horizontal Scaling Plan

Reverb is deployed on a single server. Connection count grows and the server runs out of file descriptors. Users are disconnected.

**Better approach:** Plan for horizontal scaling from the start. Use Redis backbone for multi-instance deployments.

## Mistake: Broadcasting Raw Data

Eloquent models are broadcast directly in events. Serialization exposes internal field names and potentially sensitive data.

**Better approach:** Use DTOs or resource classes to control what data is broadcast to clients.

---

# Examples

## Analytics Event Broadcasting

```php
class RevenueUpdated implements ShouldBroadcast
{
    public function __construct(
        public string $dashboardId,
        public array $metrics
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("analytics.dashboard.{$this->dashboardId}")];
    }
}
```

## Client-Side Echo Subscription

```javascript
Echo.private(`analytics.dashboard.${dashboardId}`)
    .listen('RevenueUpdated', (e) => {
        updateRevenueChart(e.metrics);
    });
```

---

# Related Topics

- Reverb Scaling — Horizontal scaling with shared Redis backbone
- Custom Reverb Driver — Extending Reverb with custom broadcasting drivers
- ClickHouse Materialized Views — Backend analytics computation feeding broadcasts
