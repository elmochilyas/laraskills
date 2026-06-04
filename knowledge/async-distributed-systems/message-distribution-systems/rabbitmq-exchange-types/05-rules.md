# Rule Card: K036 — RabbitMQ Exchange Types

---

## Rule 1

**Rule Name:** use-direct-exchange-for-point-to-point

**Category:** Prefer

**Rule:** Prefer direct exchanges for point-to-point job dispatch (one publisher, one consumer).

**Reason:** Direct exchanges route by exact routing key match — simplest topology, lowest overhead.

**Bad Example:**
```php
// Topic exchange for simple job dispatch — unnecessary complexity
$this->channel->exchange_declare('jobs', 'topic');
$this->channel->queue_bind('high_priority', 'jobs', 'job.high.*');
```

**Good Example:**
```php
// Direct exchange — one routing key, one consumer
$this->channel->exchange_declare('jobs', 'direct');
$this->channel->queue_bind('high_priority', 'jobs', 'high');
```

**Exceptions:** Fanning out jobs to multiple workers based on category needs a topic exchange.

**Consequences Of ViolATION:** Simple job dispatch uses a topic exchange with wildcard bindings — routing logic is unnecessarily complex, and a misconfigured binding pattern causes jobs to be delivered to the wrong consumer.

---

## Rule 2

**Rule Name:** use-fanout-exchange-for-broadcast-events

**Category:** Always

**Rule:** Always use fanout exchanges for broadcast events that all consumers need.

**Reason:** Fanout delivers every message to every bound queue — no routing logic, consumer wins.

**Bad Example:**
```php
// Direct exchange — must bind each consumer with specific routing key
$this->channel->queue_bind('audit_log', 'events', 'user.created');
$this->channel->queue_bind('webhook_sender', 'events', 'user.created');
```

**Good Example:**
```php
// Fanout — every consumer receives everything
$this->channel->exchange_declare('user.events', 'fanout');
$this->channel->queue_bind('audit_log', 'user.events');
$this->channel->queue_bind('webhook_sender', 'user.events');
```

**Exceptions:** Consumers that need only a subset of events should use topic exchanges instead.

**Consequences Of ViolATION:** A new event type is added — each consumer must opt in via routing key. One team forgets to bind, and their consumer silently misses the new event type.

---

## Rule 3

**Rule Name:** use-topic-exchange-for-selective-routing

**Category:** Prefer

**Rule:** Prefer topic exchanges when consumers need a subset of events based on patterns.

**Reason:** Topic routing keys with wildcards (`*`, `#`) give flexible pattern-based routing.

**Bad Example:**
```php
// Multiple direct exchanges — management nightmare
$this->channel->exchange_declare('us.orders', 'direct');
$this->channel->exchange_declare('eu.orders', 'direct');
$this->channel->exchange_declare('us.payments', 'direct');
```

**Good Example:**
```php
// Single topic exchange — flexible routing
$this->channel->exchange_declare('events', 'topic');
$this->channel->queue_bind('us_team', 'events', 'us.#');
$this->channel->queue_bind('ops_team', 'events', '*.orders');
```

**Exceptions:** When only one routing pattern exists, a direct exchange is simpler.

**Consequences Of ViolATION:** Adding a new geographic region requires creating 5 new exchanges and modifying publisher code — instead of one new binding, the publisher must know about every destination queue.

---

## Rule 4

**Rule Name:** bind-queue-to-header-with-x-match

**Category:** Prefer

**Rule:** Prefer header exchanges when routing depends on multiple attributes.

**Reason:** Header exchanges match by message header content — supports AND/OR matching.

**Bad Example:**
```php
// Complex routing key encodes multiple attributes: "priority.high.region.us.type.order"
$this->channel->queue_bind('critical_queue', 'jobs', 'high.us.order');
// Fragile — parsing position-dependent routing keys
```

**Good Example:**
```php
$this->channel->exchange_declare('jobs', 'headers');
$this->channel->queue_bind('critical_queue', 'jobs', false, false, false, false, [
    'x-match' => 'all',
    'priority' => 'high',
    'region' => 'us',
    'type' => 'order',
]);
```

**Exceptions:** Single-attribute routing is simpler with direct or topic exchanges.

**Consequences Of ViolATION:** A routing key like `high.us.2024.order` is parsed positionally — adding a `channel` attribute requires re-encoding all routing keys and redeploying publishers, a fragile and breaking change.
