# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K003 — QueueManager and Connector Pattern
- **Knowledge ID:** K003
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\QueueManager`, `Illuminate\Queue\Connectors\*`

---

# Overview

The `QueueManager` is the central registry and factory for all queue connections, implementing the Manager pattern used throughout the framework. It lazily resolves connections on first access, caches them for the lifetime of the worker/request, and delegates to driver-specific Connector classes to instantiate Queue instances. Understanding this architecture is essential for adding custom queue drivers, extending existing ones, or debugging connection resolution issues.

---

# Core Concepts

- **Manager pattern:** Factory class that lazily resolves named service instances. Implements both `Factory` (creating connections) and `Monitor` (observing worker events).
- **Connector pattern:** Each driver has a Connector implementing `ConnectorInterface::connect(array $config)` that returns a Queue instance.
- **Lazy resolution:** Connections created on first `connection()` call, not when the manager is instantiated.
- **Registration:** Built-in connectors registered in `QueueServiceProvider`. Custom drivers via `Queue::extend()` or `Queue::addConnector()`.
- **`__call` proxy:** Static facade calls on `Queue` are proxied to the default connection.

---

# When To Use (custom drivers)

- Using non-built-in queue backends (RabbitMQ, Kafka, Google Pub/Sub)
- Need driver-specific behavior (e.g., custom SQS message attributes)
- Extending existing drivers with cross-cutting behavior

---

# When NOT To Use (custom drivers)

- Standard Laravel drivers meet your needs
- Only need different queue names — use existing connection with multiple queues

---

# Best Practices

- **Custom connectors must return a full `Queue` contract.** Not implementing `push`, `pop`, `delete`, `release`, `size` causes runtime errors. *Why: All framework code (Worker, dispatch, commands) depends on the Queue contract — missing methods cause errors that surface only at runtime.*
- **Register custom drivers via service provider, not `extend()` in routes.** Service provider registration is permanent; `extend()` is for runtime. *Why: The service provider boot method runs before middleware and controllers — the driver is registered before any queue operations happen.*
- **For custom drivers, connect lazily.** Defer TCP/HTTP connections inside `connect()` rather than in the constructor. *Why: The manager creates connector instances eagerly — a lazy connect avoids establishing backends that may never be used.*

---

# Performance Considerations

- Connection resolution is one-time per connection name per worker — negligible overhead.
- `connection()` returns the cached instance — no re-resolution.
- Custom connectors should defer actual backend connections (per-connect, not per-constructor).

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| New connection per queue name | Confusing connection and queue | Unnecessary infrastructure | One connection, many queue names |
| Custom connector returns wrong type | Not implementing full Queue contract | Runtime error on first push | Ensure full contract implementation |

---

# Related Topics

- **K001 Queue Connections vs. Queues (K001)** — Distinction
- **K004 Job Serialization (K004)** — Payload structure
