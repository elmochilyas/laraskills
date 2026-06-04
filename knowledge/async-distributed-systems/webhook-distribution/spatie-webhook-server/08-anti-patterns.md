---
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: K066 — Spatie Laravel Webhook Server
Knowledge ID: K066
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Monolithic Webhook Profile | Architecture | Medium |
| 2 | Inline Webhook Dispatch in Request Lifecycle | Performance | Medium |
| 3 | Infinite Retry Without Deadline | Operations | Critical |
| 4 | Global Secret for Retry Fallback | Security | High |
| 5 | No Queue Dedicated to Webhook Delivery | Performance | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Single Profile for All Endpoints | Medium — tight coupling, reduced testability | One profile per webhook type |
| Infinite Retry Without `retry_until` | Critical — zombie retries forever | Always set `retry_until` deadline |
| Shared Secret Across Endpoints | High — single breach cascades | Per-endpoint secrets stored in env vars |

---

## 1. Monolithic Webhook Profile

### Category
Architecture

### Description
A single webhook profile class handling all webhook types with conditionals for different endpoints. Results in tight coupling, reduced testability, and configuration that's harder to maintain as the number of endpoints grows.

### Why It Happens
- Starting with one webhook endpoint and never splitting
- Not understanding profiles are per-endpoint
- Adding new endpoints to the existing profile for convenience
- "It's just one more if statement" — accumulates over time
- Not extracting common logic into shared base classes

### Warning Signs
- Single profile class with multiple `if/else` or `switch` blocks for different endpoints
- Profile constructor takes multiple different parameters based on endpoint type
- Adding a new webhook endpoint requires modifying the existing profile
- Profile class is long (> 100 lines) and hard to test
- Different endpoints share payload serialization logic incorrectly

### Why Harmful
The profile class grows to 300 lines with conditionals for Stripe, GitHub, Slack, and three custom partner APIs. Adding a new webhook endpoint requires modifying the existing profile — risk of breaking existing endpoints. Testing requires mocking conditions for all endpoints even when only one is changed. Configuration is tangled: Stripe's timeout setting is in the same method as GitHub's retry policy.

### Consequences
- Profile class becomes fragile — changes risk breaking other endpoints
- Testing is complex (must account for all endpoint variations)
- Adding new endpoints is risky (modify existing tested code)
- Configuration coupling: Stripe settings next to GitHub settings
- Onboarding: new developer must understand all endpoints at once
- Refactoring is significant: extracting profiles is "the big rewrite"

### Alternative
- Define one profile per webhook type:
  ```php
  class StripeWebhookProfile implements WebhookProfile { ... }
  class GitHubWebhookProfile implements WebhookProfile { ... }
  class PartnerAPIWebhookProfile implements WebhookProfile { ... }
  ```
- Extract shared logic (signing, serialization) into a base class or trait
- Each profile handles only its endpoint's concerns

### Refactoring Strategy
1. Identify distinct webhook endpoint types in the current single profile
2. Create a separate profile class for each endpoint type
3. Extract shared logic into a base class or trait
4. Update dispatch calls to use the new profile classes
5. Test each profile independently

### Detection Checklist
- [ ] Each webhook endpoint type has its own profile class
- [ ] No conditionals for endpoint type in profile logic
- [ ] Adding a new endpoint creates a new profile class
- [ ] Shared logic extracted to base class/trait
- [ ] Profiles are testable in isolation

### Related Rules
- use-webhook-profile-for-consistency

### Related Skills
- Configure Spatie Webhook Server for Certified Delivery

### Related Decision Trees
- Spatie Webhook Server vs Custom Webhook Implementation

---

## 2. Inline Webhook Dispatch in Request Lifecycle

### Category
Performance

### Description
Calling `WebhookCall::create()->dispatch()` directly in a controller or event listener. This adds synchronous database write latency (creating the `webhook_calls` record) to the HTTP response path, increasing response time.

### Why It Happens
- Not considering that `dispatch()` writes to the database before queuing
- Assuming dispatch is always instantaneous
- Putting dispatch code directly in the controller or listener
- Not extracting dispatch into a queued event listener or command handler
- "It's just one database write" — accumulated across requests, it matters

### Warning Signs
- `WebhookCall::create()->dispatch()` directly in controller action
- Event listener dispatches webhook calls inline
- HTTP response time increases when webhook dispatches are added
- Database write latency from `webhook_calls` table affects response times
- No async queueing: the dispatch happens in the request lifecycle

### Why Harmful
Each `dispatch()` call writes a record to the `webhook_calls` table synchronously. At 100 requests/second, that's 100 database writes/second added to the response path. A database write taking 10ms adds 10ms to every response. Under load, the database becomes a bottleneck for the web response. The dispatch that should be async is adding synchronous latency to the user-facing request.

### Consequences
- Increased HTTP response time (database write latency)
- Database write contention on `webhook_calls` table
- User-facing slowdown from backend dispatch latency
- Cascading: slow responses cause users to retry, generating more webhook dispatches
- Request concurrency limited by database write throughput
- "The page is slow" — traced to webhook dispatch writes

### Alternative
- Extract dispatch from the request lifecycle:
  ```php
  // Event listener dispatches a job (async)
  class OrderPlacedListener
  {
      public function handle(OrderPlaced $event): void
      {
          DispatchOrderWebhooks::dispatch($event->order);
      }
  }
  
  // In the job, dispatch the webhook call
  class DispatchOrderWebhooks implements ShouldQueue
  {
      public function handle(): void
      {
          WebhookCall::create()
              ->url($this->webhookUrl)
              ->payload([...])
              ->dispatch(); // Database write happens here — in worker, not request
      }
  }
  ```
- The dispatch to the Spatie queue happens in a worker, not in the HTTP request

### Refactoring Strategy
1. Identify all inline `WebhookCall::create()->dispatch()` calls
2. Extract each into a queued job or command handler
3. Dispatch the extraction job from the controller/listener
4. Test: webhook calls still deliver but no longer affect response time
5. Monitor HTTP response time — expect reduction

### Detection Checklist
- [ ] No inline `WebhookCall::create()->dispatch()` in request lifecycle
- [ ] Webhook dispatch extracted to queued jobs
- [ ] HTTP response time not affected by webhook dispatch
- [ ] Database write latency for `webhook_calls` does not affect users
- [ ] Queue workers handle webhook dispatch

### Related Rules
- process-webhooks-asynchronously

### Related Skills
- Configure Spatie Webhook Server for Certified Delivery

### Related Decision Trees
- Spatie Webhook Server vs Custom Webhook Implementation

---

## 3. Infinite Retry Without Deadline

### Category
Operations

### Description
Not configuring `retry_until` on the webhook profile. The webhook server retries delivery attempts indefinitely based solely on job `$tries` — which may be set to very high or default values, causing weeks or months of retries for a permanently dead endpoint.

### Why It Happens
- Not knowing `retry_until` exists
- Relying on job `$tries` as the only retry limit
- Not considering that endpoints can become permanently unavailable
- Using the default retry configuration without customizing for webhooks
- "We set max attempts to 10, that's limited" — 10 attempts with exponential backoff can span days

### Warning Signs
- Webhook profile omits `getRetryUntil()` method
- No `retry_until` timestamp set on webhook calls
- Webhooks for deactivated partners continue retrying for days
- `failed_jobs` table fills with webhook failure records
- "Why are we still sending webhooks to a partner that went out of business?"

### Why Harmful
A partner endpoint returns 500 for a week during maintenance. With exponential backoff starting at 10s and max delay of 600s, the system retries every 5-10 minutes for 7 days = 1000+ failed attempts per webhook. Each attempt writes to the database. The `webhook_calls` table grows by millions of records. Queue capacity is consumed by these zombie retries, delaying processing for valid webhooks to other endpoints.

### Consequences
- Indefinite retries for unavailable endpoints (days or weeks)
- Queue capacity consumed by zombie webhook retries
- Database storage grows unbounded (webhook_calls table)
- Failed job monitoring is polluted with noise
- No automatic retirement of dead endpoints
- Manual cleanup: find and mark dead endpoints

### Alternative
- Always set `retry_until` on every webhook profile:
  ```php
  class OrderWebhookProfile implements WebhookProfile
  {
      public function getRetryUntil(): Carbon
      {
          return now()->addHours(24); // Stop after 24 hours
      }
  }
  ```
- Align deadline with business SLA:
  - Non-critical webhooks: 1-4 hours
  - Standard webhooks: 24 hours
  - Critical webhooks: 48-72 hours
- Combine with job `$tries` as a secondary limit

### Refactoring Strategy
1. Audit all webhook profiles for `getRetryUntil()` implementation
2. Add `retry_until` to profiles that lack it
3. Set deadline based on business delivery SLA
4. Implement post-deadline handling: alert, dead-letter queue, profile deactivation
5. Monitor retry window — verify retries stop after deadline

### Detection Checklist
- [ ] Every webhook profile implements `getRetryUntil()`
- [ ] Deadline aligns with business SLA
- [ ] Retries stop after deadline (monitored)
- [ ] Post-deadline handling implemented
- [ ] No zombie retries for indefinitely dead endpoints

### Related Rules
- set-max-attempts-not-infinite

### Related Skills
- Configure Spatie Webhook Server for Certified Delivery

### Related Decision Trees
- Spatie Webhook Server vs Custom Webhook Implementation

---

## 4. Global Secret for Retry Fallback

### Category
Security

### Description
Configuring a single fallback signing secret that is used when per-endpoint secret validation fails. This subverts the per-endpoint security model — if the fallback secret is compromised, ALL endpoints are vulnerable regardless of their individual secret strength.

### Why It Happens
- Trying to handle secret rotation gracefully during transition periods
- Implementing a "backup secret" pattern for reliability
- Not understanding the security implications of a shared fallback
- Copying a pattern from another system that uses fallback secrets
- "It's just for transition periods" — but it stays forever

### Warning Signs
- Fallback secret configured in addition to per-endpoint secrets
- Signature verification checks primary then falls back to global secret
- Documentation: "if the primary secret fails, the system tries the global fallback"
- "We use a fallback secret for legacy endpoints" — legacy of all endpoints
- Secret rotation: old and new secrets are both accepted through the global fallback

### Why Harmful
Each endpoint has its own secret, but there's a global fallback secret. If an attacker compromises the Stripe integration's secret, they can forge Stripe webhooks. But if they compromise the global fallback secret (perhaps leaked through a GitHub integration), they can forge webhooks for ALL endpoints. The fallback secret creates a single point of failure for the entire webhook system.

### Consequences
- One compromised fallback secret exposes all endpoints
- Per-endpoint secrets are undermined by the fallback
- Auditing: impossible to know which secret was used for verification
- Security posture degraded: the weakest secret (fallback) protects all
- Compliance violation: shared secret contradicts security best practices
- Secret rotation complexity: must rotate both per-endpoint AND fallback

### Alternative
- NEVER use a global fallback secret. Fix the root cause instead:
  - If secret rotation is the concern: support multiple active secrets per endpoint (not a global fallback)
  - If legacy endpoints don't have secrets: migrate them to have secrets
  - If endpoints share the same secret: they should each have unique secrets
- For grace periods during rotation: add the old secret as a secondary valid secret for that specific endpoint only

### Refactoring Strategy
1. Remove any global fallback secret configuration
2. For endpoints that need secret transition: add old and new secrets per-endpoint
3. Ensure each endpoint validates only against its own secrets
4. Implement proper secret rotation: add new secret, verify, remove old secret
5. Audit that no fallback path exists in signature verification

### Detection Checklist
- [ ] No global fallback secret exists
- [ ] Each endpoint validates only against its own secrets
- [ ] Secret rotation: old + new secrets per-endpoint, not globally
- [ ] No shared secret path undermines per-endpoint security
- [ ] Audit confirms single-secret-per-endpoint verification

### Related Rules
- store-webhook-secrets-securely, sign-all-outgoing-webhooks

### Related Skills
- Configure Spatie Webhook Server for Certified Delivery

### Related Decision Trees
- Spatie Webhook Server vs Custom Webhook Implementation

---

## 5. No Queue Dedicated to Webhook Delivery

### Category
Performance

### Description
Using the default queue connection for webhook delivery, mixing webhook HTTP calls (I/O-bound, potentially slow) with application job processing. A slow webhook endpoint stalls a worker, blocking application job processing on the same queue.

### Why It Happens
- Not separating queue concerns from the start
- Assuming all queue work is equivalent
- Not considering that HTTP calls can be unpredictable (timeouts, DNS, network)
- Using default queue connection for everything
- "We don't have enough webhook volume to need a dedicated queue" — until one slow endpoint stalls all workers

### Warning Signs
- Webhook delivery uses the same queue as application jobs
- One slow webhook endpoint causes all queues to back up (head-of-line blocking)
- Horizon shows "webhooks" and "default" queues on the same supervisor
- Application job processing delayed when webhook delivery is slow
- "Our email jobs are delayed" — traced to a slow partner webhook endpoint

### Why Harmful
A partner's webhook endpoint is experiencing intermittent 30-second timeouts. Every webhook delivery to that partner ties up a worker for 30 seconds. With 10 workers on the default queue, 3 workers are stuck on slow webhook deliveries. Email processing, data export, and cache warming jobs are delayed because workers are occupied with webhooks. A single slow endpoint degrades the entire queue system.

### Consequences
- Head-of-line blocking: slow webhooks delay all other queue processing
- Application job latency increases unpredictably
- Workers wasted on slow HTTP calls instead of processing application jobs
- Scaling: must add more workers to compensate for webhook latency
- Degraded SLAs for time-sensitive application jobs (password resets, payment processing)
- Debugging confusion: "why are my jobs delayed?" — webhook queue contention

### Alternative
- Use a dedicated queue for webhook delivery:
  ```php
  WebhookCall::create()
      ->url($url)
      ->payload($data)
      ->onQueue('webhooks') // Dedicated queue
      ->dispatch();
  ```
- Configure a dedicated Horizon supervisor for the `webhooks` queue:
  ```php
  'supervisor-webhooks' => [
      'queue' => ['webhooks'],
      'connection' => 'redis',
      'balance' => 'auto',
      'minProcesses' => 2,
      'maxProcesses' => 10,
      'tries' => 3,
      'timeout' => 120, // Higher timeout for HTTP calls
  ],
  ```

### Refactoring Strategy
1. Identify all webhook delivery dispatches
2. Add `->onQueue('webhooks')` to all webhook dispatches
3. Configure a dedicated queue in queue config
4. Set up a Horizon supervisor for the webhook queue with appropriate timeout
5. Monitor: webhook delivery latency should not affect application job processing

### Detection Checklist
- [ ] Webhook delivery uses a dedicated queue
- [ ] Application jobs are not delayed by webhook delivery
- [ ] Dedicated Horizon supervisor for webhooks
- [ ] Webhook queue has appropriate timeout setting (higher for HTTP calls)
- [ ] No head-of-line blocking from slow webhook endpoints

### Related Rules
- use-webhook-profile-for-consistency

### Related Skills
- Configure Spatie Webhook Server for Certified Delivery

### Related Decision Trees
- Spatie Webhook Server vs Custom Webhook Implementation
