# Anti-Patterns — Spatie laravel-webhook-server Dispatch and Retry Customization

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit | Spatie laravel-webhook-server Dispatch and Retry Customization |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Controller-Dispatch Coupling
2. Unlimited Retry Abyss
3. Delivery Event Silence
4. Default Queue Dispatch
5. Plain-Text Webhook URL Storage

---

## 1. Controller-Dispatch Coupling

### Category
Code Organization

### Description
Creating and dispatching `WebhookCall` instances directly inside controllers instead of extracting dispatch logic into dedicated service classes.

### Why It Happens
The fluent `WebhookCall::create()->url()->payload()->dispatch()` API is concise and easy to call from anywhere. Controllers are the natural place where business events occur (order placed, user registered), so the dispatch call is added directly in the controller method. The pattern feels natural and requires no additional abstraction.

### Warning Signs
- `WebhookCall::create()` calls in multiple controller methods
- Dispatch logic duplicated across controllers
- Testing webhook dispatch requires HTTP request setup
- Controller methods contain both HTTP response logic and webhook dispatch setup

### Why Harmful
Controllers should handle HTTP request validation and response only. Embedding webhook dispatch logic violates single responsibility, making controllers harder to test and maintain. Dispatch logic scattered across controllers cannot be reused from non-HTTP contexts (CLI commands, queue jobs, scheduled tasks).

### Consequences
- Webhook dispatch cannot be unit-tested without HTTP context
- Same dispatch logic duplicated across controllers
- Dispatch cannot be reused from CLI or queue contexts
- Business logic coupled to HTTP layer

### Alternative
Extract webhook dispatch logic into dedicated service classes with methods like `dispatchOrderCreated(Order $order)`.

### Refactoring Strategy
1. Create a `WebhookDispatchService` class (or per-event service classes)
2. Extract webhook dispatch logic from each controller into service methods
3. Inject service into controllers via constructor or action injection
4. Replace inline `WebhookCall::create()` calls with service method calls
5. Write unit tests for the service class independently of HTTP

### Detection Checklist
- [ ] No `WebhookCall::create()` calls in controllers
- [ ] Webhook dispatch in dedicated service classes
- [ ] Service methods reusable from non-HTTP contexts
- [ ] Unit tests for dispatch logic without HTTP setup

### Related Rules
Create WebhookCall from Service Classes, Not Controllers

### Related Skills
Use Spatie Webhook Server for Outgoing Webhook Delivery

### Related Decision Trees
Dispatch Location Strategy (Controller vs Service Class)

---

## 2. Unlimited Retry Abyss

### Category
Reliability

### Description
Not configuring `max_attempts` on webhook server configuration, allowing infinite retry chains for undeliverable webhooks that consume queue workers and database storage permanently.

### Why It Happens
The default `max_attempts` is `null` (unlimited) in some configurations. Developers don't set an explicit value, assuming the default is reasonable. A subscriber endpoint that goes permanently offline causes infinite retries, each attempt storing a new record and consuming a queue worker indefinitely.

### Warning Signs
- `max_attempts` set to `null` or not configured in `config/webhook-server.php`
- WebhookCall records for a single dead endpoint number in the hundreds
- Retry attempts never stop for persistently failing endpoints
- Queue workers permanently occupied by dead subscriber retries

### Why Harmful
An undeliverable webhook consumes a queue worker timeslice on every retry. With unlimited retries, the dead subscriber occupies worker capacity permanently. Over time, multiple dead subscribers consume all available workers, delaying delivery to healthy subscribers and blocking application jobs.

### Consequences
- Queue workers permanently occupied by dead endpoints
- Healthy subscribers delayed by zombie retry chains
- Unbounded webhook_calls table growth
- Final failure never reached — no escalation or alerting

### Alternative
Set `max_attempts` to a finite value (10-15 for critical webhooks) based on the desired delivery window.

### Refactoring Strategy
1. Set `'max_attempts' => 10` in `config/webhook-server.php`
2. For per-webhook customization, pass max_attempts via custom backoff strategy
3. Implement `FinalWebhookCallFailedEvent` listener for dead endpoint alerting
4. Review and clean up existing zombie WebhookCall records
5. Monitor max_attempts reached rate as a delivery metric

### Detection Checklist
- [ ] `max_attempts` set to finite value in configuration
- [ ] No zombie retry chains in production
- [ ] FinalWebhookCallFailedEvent fired on retry exhaustion
- [ ] Subscriber health tracking to skip dead endpoints proactively

### Related Rules
Always Configure max_attempts

### Related Skills
Use Spatie Webhook Server for Outgoing Webhook Delivery

### Related Decision Trees
Max Attempts and Retry Configuration

---

## 3. Delivery Event Silence

### Category
Observability

### Description
Not registering listeners for `WebhookCallSucceededEvent`, `WebhookCallFailedEvent`, or `FinalWebhookCallFailedEvent`, leaving delivery failures completely silent and undetected.

### Why It Happens
The Spatie webhook-server dispatches events but doesn't require listeners. Developers configure the dispatch pipeline and assume monitoring will be set up later. The package works without listeners — webhooks are sent, failures are logged to the database — so the missing observability is invisible until a subscriber reports missing webhooks.

### Warning Signs
- No event listeners registered for webhook delivery events
- Delivery failures only visible via database inspection
- Subscribers report missing webhooks days after they occurred
- No alerting on delivery degradation

### Why Harmful
Without event listeners, delivery failures are silent. A subscriber endpoint that goes offline generates retries and final failures without any notification. The first indication of a problem is a subscriber complaint, hours or days after the first failure. By then, the retry window has passed and events are permanently lost.

### Consequences
- Silent delivery failures undetected for hours or days
- Subscriber complaints as the first indication of problems
- Permanent event loss after retry exhaustion
- No data for delivery SLA tracking or reconciliation

### Alternative
Register listeners for `WebhookCallSucceededEvent` (logging/metrics) and `FinalWebhookCallFailedEvent` (alerting).

### Refactoring Strategy
1. Register `WebhookCallSucceededEvent` listener for delivery logging and metrics
2. Register `WebhookCallFailedEvent` listener for per-attempt failure tracking
3. Register `FinalWebhookCallFailedEvent` listener for alerting
4. Create a dashboard showing delivery success rate, retry rate, and final failure rate
5. Set up alerts for sustained failure rate increases

### Detection Checklist
- [ ] Listeners registered for success and failure events
- [ ] Delivery metrics tracked per subscriber
- [ ] Alerts configured for final failures
- [ ] Dashboard shows delivery health in real-time

### Related Rules
Register WebhookCallSucceededEvent and WebhookCallFailedEvent Listeners

### Related Skills
Use Spatie Webhook Server for Outgoing Webhook Delivery

### Related Decision Trees
Delivery Event Handling Strategy (Alerting vs Tracking)

---

## 4. Default Queue Dispatch

### Category
Performance

### Description
Dispatching outgoing webhooks on the default queue without dedicated queue isolation, allowing slow subscriber endpoints to block application job processing.

### Why It Happens
The `dispatch()` method places the webhook on the default queue unless `->onQueue()` is specified. Developers don't consider queue isolation because the webhook dispatch is just one HTTP call — it shouldn't take long. A slow subscriber (5-second timeout, retry, wait) blocks the queue for each dispatch.

### Warning Signs
- Webhook calls dispatched without `->onQueue()` or queue config
- Application job delays correlate with subscriber response time
- Horizon shows webhook dispatch jobs on the default queue
- Subscriber timeout causes cascading delays to other jobs

### Why Harmful
A single slow subscriber endpoint (5-second timeout) blocks the queue worker for 5 seconds per webhook. With 10 webhooks dispatched to the same subscriber, the default queue is blocked for 50 seconds. All application jobs queued during this period are delayed, including time-sensitive operations like password reset emails or payment confirmations.

### Consequences
- Application job processing delayed by slow subscribers
- Cannot scale webhook dispatch workers independently
- Subscriber timeout cascades to all queued operations
- Queue backpressure from retry chains affects application

### Alternative
Route all webhook dispatches to a dedicated `webhook-dispatches` queue with separate worker pool.

### Refactoring Strategy
1. Configure `'queue' => 'webhook-dispatches'` in `config/webhook-server.php`
2. Or add `->onQueue('webhook-dispatches')` to each dispatch call
3. Add dedicated worker pool for webhook-dispatches queue in Horizon
4. Set worker timeout to exceed subscriber response timeout
5. Monitor webhook-dispatch queue depth independently

### Detection Checklist
- [ ] Webhook dispatches on dedicated queue
- [ ] Separate worker pool for webhook dispatch
- [ ] Subscriber latency doesn't affect application jobs
- [ ] Independent monitoring for webhook dispatch queue

### Related Rules
Use Dedicated Queue for Webhook Dispatch

### Related Skills
Use Spatie Webhook Server for Outgoing Webhook Delivery

### Related Decision Trees
Dispatch Location Strategy (Controller vs Service Class)

---

## 5. Plain-Text Webhook URL Storage

### Category
Security

### Description
Storing subscriber webhook URLs as plain text in the database without encryption at rest, exposing sensitive endpoint addresses in case of a database breach.

### Why It Happens
Webhook URLs are stored in the subscribers table as regular string columns. Developers don't consider them sensitive because they're just URLs. The encryption requirement becomes apparent only during security audits or compliance reviews (PCI DSS, SOC 2).

### Warning Signs
- Webhook URL column in database is a plain VARCHAR/text
- No encryption cast on the model attribute
- Security audit flags unencrypted sensitive configuration storage
- Compliance review requires encryption for subscriber endpoint data

### Why Harmful
Webhook URLs reveal the subscriber's endpoint infrastructure and, when combined with the payload format, enable an attacker to send fraudulent webhooks. A database breach exposes all subscriber webhook URLs, allowing targeted attacks against external systems. Compliance frameworks require encryption of sensitive endpoint data.

### Consequences
- Database breach exposes subscriber infrastructure details
- Attackers can discover and target subscriber endpoints
- Compliance violations for sensitive data storage
- Trust erosion with subscribers whose URLs are exposed

### Alternative
Encrypt webhook URLs at rest using Laravel's `AsEncryptedString` cast or a dedicated encryption service.

### Refactoring Strategy
1. Add `use Illuminate\Database\Eloquent\Casts\AsEncryptedString;` to the Subscriber model
2. Change the `webhook_url` column cast: `'webhook_url' => AsEncryptedString::class`
3. Run a migration to encrypt existing plain-text URLs
4. Verify encrypted URLs are transparently decrypted on access
5. Ensure backup exports also handle encrypted columns correctly

### Detection Checklist
- [ ] Webhook URLs encrypted at rest
- [ ] Encryption cast applied to model attribute
- [ ] Existing URLs migrated to encrypted format
- [ ] Compliance review passes for sensitive data storage

### Related Rules
Do Not Store Webhook URLs in Plain Text

### Related Skills
Use Spatie Webhook Server for Outgoing Webhook Delivery

### Related Decision Trees
Max Attempts and Retry Configuration
