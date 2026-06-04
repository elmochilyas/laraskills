# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** K036 — RabbitMQ Exchange Types
- **Knowledge ID:** K036
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - RabbitMQ Docs — Exchanges
  - `vyuldashev/laravel-queue-rabbitmq` package

---

# Overview

RabbitMQ decouples publishers from queues through exchanges — message routers that determine how messages reach queues. **Direct** exchanges route by exact routing key match. **Fanout** broadcasts to all bound queues. **Topic** routes by pattern-matched routing keys. **Headers** routes by message header attributes. When using RabbitMQ as a Laravel queue driver, understanding exchanges is critical for routing messages to the correct workers.

---

# Core Concepts

- **Exchange:** Router that receives messages from producers and routes to queues based on type and binding rules.
- **Binding:** Link between an exchange and a queue, with optional routing key.
- **Direct exchange:** Routes by exact match of routing key to binding key.
- **Fanout exchange:** Routes to ALL bound queues, ignoring routing key — broadcast pattern.
- **Topic exchange:** Routes by wildcard matching — `*` (one word), `#` (zero or more words).
- **Headers exchange:** Routes based on message header key-value pairs with `x-match = all` or `any`.

---

# When To Use

- **Direct:** Simple Laravel queue patterns — one queue per job type.
- **Topic:** Multi-service routing — different consumers need different message subsets.
- **Fanout:** Event broadcast — cross-service domain events.
- **Headers:** Complex routing based on metadata, not message content.

---

# When NOT To Use

- Topic exchange when routing keys are always exact — direct is simpler and faster.
- Fanout when selective routing is needed — all queues receive all messages.
- Headers when simpler exchange types suffice — adds complexity without benefit.

---

# Best Practices

- **Use durable exchanges in production.** Non-durable exchanges disappear on broker restart — messages in bound queues become unroutable. *Why: `durable = true` ensures exchange metadata persists across broker restarts — messages continue to route after recovery.*
- **Use direct exchange for most Laravel queue use cases.** RabbitMQ as a Laravel driver typically maps queue names to routing keys — direct is the simplest, fastest exchange. *Why: Direct exchange routing is O(1) — no pattern matching overhead, no header comparison, just exact string comparison.*
- **Standardize routing key conventions for topic exchanges.** Consistent hierarchy (e.g., `us.orders.created`) prevents routing mismatches. *Why: Topic exchange routing depends on producers and consumers agreeing on the routing key format — a single inconsistent key breaks the pattern.*
- **Monitor bindings — they persist after queue deletion.** Orphaned bindings accumulate and can cause unexpected routing after re-creation. *Why: RabbitMQ does not auto-clean bindings for deleted queues — stale bindings may route messages to queues that no longer exist.*

---

# Performance Considerations

- Direct: O(1) routing — fastest.
- Fanout: O(n) where n = bound queues — each message delivered to all queues.
- Topic: pattern matching adds CPU overhead per message.
- Headers: header comparison adds CPU overhead — slowest.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Topic exchange with exact routing keys | Over-engineering | Unnecessary pattern matching overhead | Use direct exchange |
| Non-durable exchange in production | Not setting durable flag | Exchange lost on restart — unroutable messages | Always set `durable = true` |
| Binding key mismatch | Producer uses `order.created`, binding is `order.*` | Direct exchange: no match → message dropped | Match binding to exchange type |

---

# Examples

```php
// config/queue.php with vyuldashev/laravel-queue-rabbitmq
'connections' => [
    'rabbitmq' => [
        'driver' => 'rabbitmq',
        'exchange_name' => 'laravel_exchange',
        'exchange_type' => 'topic', // direct, fanout, topic, headers
        'queue' => 'default',
    ],
],
```

---

# Related Topics

- **K037 RabbitMQ Dead-Letter Queues (K037)** — DLX routing
- **K040 Redis Streams (K040)** — Contrast with RabbitMQ
