# Rule Card: K030 — Broadcasting System Overview

---

## Rule 1

**Rule Name:** keep-broadcast-payloads-minimal

**Category:** Always

**Rule:** Always keep broadcast event payloads minimal — send IDs, not full models.

**Reason:** Large payloads increase serialization time, WebSocket message size, and client-side processing.

**Bad Example:**
```php
class OrderShipped implements ShouldBroadcast
{
    public function __construct(public Order $order) {} // Full model serialized
}
```

**Good Example:**
```php
class OrderShipped implements ShouldBroadcast
{
    public function __construct(public int $orderId, public string $status) {}
}
```

**Exceptions:** Small, non-sensitive payloads with only a few fields are acceptable.

**Consequences Of Violation:** Broadcast messages become large (10KB+), increasing latency and consuming bandwidth — especially on mobile clients.

---

## Rule 2

**Rule Name:** use-broadcast-now-for-realtime

**Category:** Prefer

**Rule:** Prefer `ShouldBroadcastNow` for truly time-sensitive events.

**Reason:** `ShouldBroadcast` queues the broadcast — worker backlog delays delivery unpredictably.

**Bad Example:**
```php
class ChatMessageSent implements ShouldBroadcast // Queued — delay depends on worker
```

**Good Example:**
```php
class ChatMessageSent implements ShouldBroadcastNow // Immediate push to WebSocket
```

**Exceptions:** Non-critical events (activity feeds, analytics) can tolerate queue delay.

**Consequences Of Violation:** Chat messages, live cursor positions, and collaborative edits arrive seconds late — users perceive the app as sluggish.

---

## Rule 3

**Rule Name:** never-broadcast-sensitive-data-public

**Category:** Never

**Rule:** Never broadcast sensitive data on public channels.

**Reason:** Public channels have no authentication — any client with the channel name can subscribe.

**Bad Example:**
```php
return ['orders.'.$this->orderId]; // Public channel — anyone can listen to any order
```

**Good Example:**
```php
return [new PrivateChannel('orders.'.$this->orderId)]; // Authenticated
```

**Exceptions:** Public announcements, stock tickers, and other non-sensitive data are fine on public channels.

**Consequences Of Violation:** A malicious client subscribes to public channels and intercepts user-specific notifications, order details, or personal data.

---

## Rule 4

**Rule Name:** monitor-broadcast-queue-backlog

**Category:** Always

**Rule:** Always monitor the broadcast queue backlog.

**Reason:** Broadcast events are queued by default — worker saturation directly impacts real-time freshness.

**Bad Example:**
```php
// No monitoring — broadcast backlog invisible until users complain
```

**Good Example:**
```php
// Monitor broadcast queue depth
$depth = Redis::llen('queues:broadcast');
if ($depth > 100) { alert('Broadcast backlog growing'); }
```

**Exceptions:** Low-volume applications with dedicated broadcast workers may not need monitoring.

**Consequences Of Violation:** Broadcast events pile up in the queue — real-time features become "eventually consistent" with delays of minutes, but no alert fires.
