# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** K037 — RabbitMQ Dead-Letter Queues and Per-Message Ack
- **Knowledge ID:** K037
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - RabbitMQ Docs — Dead Letter Exchanges
  - RabbitMQ Docs — Consumer Acknowledgements

---

# Overview

RabbitMQ provides native dead-letter queue (DLQ) support through exchange-level configuration. When a message is negatively acknowledged (`basic.nack`), rejected (`basic.reject`), or expires (TTL), the broker routes it to a configured dead-letter exchange, which routes it to a dead-letter queue. This is more robust than application-level DLQ because routing happens at the broker level — the message never reaches the consumer. Per-message acknowledgment (`basic.ack`/`basic.nack`) gives consumers fine-grained control over message handling at the protocol level.

---

# Core Concepts

- **Dead-letter exchange (DLX):** Exchange configured on a queue. Rejected/nack'ed/expired messages are routed here.
- **Dead-letter queue (DLQ):** Queue bound to the DLX. Stores failed messages for inspection or reprocessing.
- **`x-dead-letter-exchange`:** Queue argument specifying the DLX name.
- **`x-dead-letter-routing-key`:** Optional — overrides original routing key for DLQ routing.
- **Per-message ack:** Consumer explicitly acknowledges (`basic.ack`) or rejects (`basic.nack`/`basic.reject`).
- **TTL to DLQ:** Messages with `x-message-ttl` that expire are routed to DLX automatically.
- **`x-death` header:** Tracks dead-letter history (count, reason, time, exchange, queue).
- **`x-delivery-limit`:** Max delivery attempts before dead-lettering (RabbitMQ 3.8+).

---

# When To Use

- Production queues where data loss from rejected messages is unacceptable
- Automatic TTL-based message cleanup with DLQ preservation
- Per-message ack for guaranteed processing — no message loss on consumer crash
- Scheduled retry via TTL + DLQ routing to retry exchange

---

# When NOT To Use

- Loss-tolerant scenarios — auto-ack is simpler and lower overhead
- Application-level DLQ already in place and adequate for your use case
- Development environments — DLQ adds configuration overhead

---

# Best Practices

- **Always configure a DLX on production queues.** Without one, rejected messages are silently dropped. *Why: When a consumer rejects a message (`basic.nack` with `requeue=false`) and no DLX is configured, the broker drops it permanently — no audit trail, no recovery.*
- **Use `basic.nack` with `requeue=false` for non-retryable failures.** Using `requeue=true` causes infinite requeue loops for failing messages. *Why: `requeue=true` puts the message back on the original queue immediately — the same consumer picks it up again and fails again, forever.*
- **Set `x-delivery-limit` to prevent infinite delivery loops.** Limit attempts before dead-lettering or dropping. *Why: Without a delivery limit, a poison message that's always rejected or nack'ed cycles through the queue infinitely, consuming resources.*
- **Monitor DLQ depth and oldest message age.** A growing DLQ with no consumer means failures are unanalyzed. *Why: DLQ without monitoring is a silent failure sink — messages pile up until disk runs out, then RabbitMQ blocks all publishing.*
- **Use `x-death` headers for debugging.** The `x-death` array tracks how many times a message was dead-lettered and why. *Why: The application-side error handler provides exception context, but `x-death` provides broker-level context — both are needed for full debugging.*

---

# Performance Considerations

- DLQ routing is broker-internal — no application overhead.
- Per-message ack requires one RabbitMQ round-trip per message (~0.1ms).
- TTL checks are lazy (on message expiry) — minimal overhead.
- `x-delivery-limit` check is per-delivery — negligible overhead.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No DLX on production queue | Unconfigured | Rejected messages silently dropped | Always configure DLX |
| `basic.reject` with `requeue=true` | Not specifying requeue=false | Infinite requeue loop for poison messages | Always use `requeue=false` |
| No monitoring on DLQ | DLQ lacks alerting | Failures pile up unnoticed until disk full | Monitor DLQ depth + age |
| DLQ with auto-ack consumer | Auto-ack removes messages | Messages deleted without inspection | Use per-message ack on DLQ consumer |

---

# Examples

```php
// Queue declaration with DLX and TTL (conceptual RabbitMQ config)
$channel->queue_declare('orders', false, true, false, false, false, [
    'x-dead-letter-exchange' => ['S', 'orders-dlx'],
    'x-message-ttl' => ['I', 3600000], // 1 hour
    'x-delivery-limit' => ['I', 3],
]);
```

---

# Related Topics

- **K036 RabbitMQ Exchange Types (K036)** — DLX routing basis
- **K023 Dead-Letter Queue Pattern (K023)** — Conceptual comparison
