---
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: K068 — Exponential Backoff in Webhook Server
Knowledge ID: K068
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | No Maximum Delay Cap — Unbounded Exponential Growth | Performance | Medium |
| 2 | No Jitter — Synchronized Retry Storms (Thundering Herd) | Performance | High |
| 3 | Infinite Retry Window — No `retry_until` | Operations | Critical |
| 4 | Hardcoded Backoff Array in Job Class | Architecture | Medium |
| 5 | Retrying 4xx Errors (Except Rate Limits) | Operations | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unbounded Backoff Growth | Medium — delays exceed relevance window | Cap max delay at 300-600 seconds |
| Synchronized Retry Storms | High — thundering herd on recovery | Always add jitter (30-50% range) |
| Infinite Retries | Critical — permanently dead endpoint retries forever | Set `retry_until` on every webhook profile |
| Retrying Client Errors | High — 4xx will never succeed | Classify 4xx (except 429/408) as non-retryable |

---

## 1. No Maximum Delay Cap — Unbounded Exponential Growth

### Category
Performance

### Description
Using pure exponential backoff without a maximum delay cap. Retry delay grows exponentially with each attempt: 10s, 20s, 40s, 80s, 160s, 320s, 640s... After 10 attempts, the delay exceeds 2 hours — most webhook payloads are no longer relevant.

### Why It Happens
- Implementing backoff as `pow(2, $attempt) * baseDelay` without clamping
- Not considering the relevance window of the webhook payload
- Assuming more attempts = better delivery probability
- Copying exponential backoff formulas without capping
- Not testing what delay values the formula produces at high attempt counts

### Warning Signs
- Webhook retry delays exceed 1 hour
- Retry schedule: 10s, 20s, 40s, 80s, 160s, 320s, 640s, 1280s (21+ minutes)
- After 10+ attempts, the delay between retries is hours
- "The webhook succeeded on attempt 15 but the data was already processed by other means"
- Backoff array (if hardcoded) shows values growing without limit

### Why Harmful
A transient DNS failure causes a webhook to fail — the 15th retry is scheduled 9 hours later. By then, the order status has already been resolved through other means (polling, manual reconciliation), and processing the webhook causes a duplicate or conflict. The exponential delay has exceeded the relevance window of the payload. The retries consume queue capacity for hours, only to deliver a payload that is no longer useful.

### Consequences
- Retries continue long past the relevance window
- Queue capacity wasted on stale webhook deliveries
- Late deliveries cause duplicate processing or conflicts
- Higher database storage for webhook attempt records
- Confusing state: "the webhook succeeded but caused a problem because it was too late"

### Alternative
- Always cap the maximum delay:
  ```php
  $baseDelay = 10;
  $maxDelay = 600; // 10 minutes cap
  $delay = min(pow(2, $attempt) * $baseDelay, $maxDelay);
  ```
- Or use a backoff array with explicit values that don't exceed the cap
- Set the cap based on the minimum between: relevance window of the payload and business SLA

### Refactoring Strategy
1. Calculate current backoff growth rate and identify when it exceeds the relevance window
2. Add `min()` cap to the delay calculation
3. Set cap at 300-600 seconds (5-10 minutes) for most webhooks
4. For time-sensitive webhooks, cap even lower
5. Monitor maximum delay reached — should never exceed the cap

### Detection Checklist
- [ ] Backoff delay capped at maximum value
- [ ] Cap doesn't exceed relevance window of payload
- [ ] No pure exponential growth beyond 10 minutes
- [ ] Backoff array (if hardcoded) has explicit max values
- [ ] Stale webhook deliveries eliminated

### Related Rules
- cap-max-retry-delay

### Related Skills
- Implement Exponential Backoff for Webhook Delivery

### Related Decision Trees
- Fixed vs Exponential Backoff for Webhook Retries

---

## 2. No Jitter — Synchronized Retry Storms (Thundering Herd)

### Category
Performance

### Description
Using pure exponential backoff without adding jitter (randomness) to the delay calculation. When a multi-tenant endpoint recovers after an outage, ALL webhooks for that endpoint retry at identical intervals — creating a synchronized DDoS on the recovering system.

### Why It Happens
- Not knowing about jitter as a pattern
- Implementing `pow(2, $attempt) * baseDelay` without random variation
- Assuming retries always happen independently (they don't — they synchronize on the failure event)
- Not testing concurrent webhook delivery recovery scenarios
- "The formula looks right" — but only for a single webhook, not for thousands

### Warning Signs
- After a downstream endpoint recovers from an outage, all retries hit simultaneously
- The downstream endpoint's error rate spikes during recovery (re-crash from the thundering herd)
- Retry timing is identical across all webhooks for the same endpoint
- "The endpoint recovered but was immediately overwhelmed"
- Jitter-related code is absent from the backoff implementation

### Why Harmful
A partner's webhook endpoint is temporarily down — 500 webhooks all retry at exactly 10s, 20s, 40s, 80s. Each retry wave is a synchronized DDoS on the endpoint, making recovery harder. The endpoint starts recovering at the 40s mark, but receives 500 simultaneous requests and crashes again. Without jitter, the retries prevent the very recovery they're waiting for.

### Consequences
- Downstream endpoint overwhelmed during recovery
- Retry storm prevents recovery (cascading failure)
- All webhooks fail again at the same time — synchronization persists through retries
- Delivery success rate drops dramatically during recovery
- "We fixed the endpoint but webhooks are still failing" — thundering herd
- Partner may rate-limit or blacklist the sender

### Alternative
- Always add jitter to the backoff delay:
  ```php
  function getDelay(int $attempt): int
  {
      $base = min(pow(2, $attempt) * 10, 600);
      $jitter = random_int(0, (int)($base * 0.5)); // 0-50% jitter
      return $base + $jitter;
  }
  ```
- Jitter range of 30-50% of the base delay is standard
- Ensure random seed is different per webhook call (default PHP rand is fine)

### Refactoring Strategy
1. Audit backoff implementations for jitter
2. Add jitter (30-50% range) to all exponential backoff calculations
3. Test with concurrent webhook deliveries — verify retry timing is staggered
4. Monitor downstream endpoint request rate during recovery — should be gradual
5. Document: jitter is non-negotiable for multi-webhook systems

### Detection Checklist
- [ ] Jitter added to backoff delay calculation
- [ ] Jitter range is 30-50% of base delay
- [ ] No identical retry timing across concurrent webhooks
- [ ] Downstream endpoint recovery is gradual (no thundering herd)
- [ ] Concurrent webhook deliveries tested

### Related Rules
- implement-exponential-backoff-with-jitter

### Related Skills
- Implement Exponential Backoff for Webhook Delivery

### Related Decision Trees
- Fixed vs Exponential Backoff for Webhook Retries

---

## 3. Infinite Retry Window — No `retry_until`

### Category
Operations

### Description
Not setting a `retry_until` timestamp on the webhook profile, causing webhook delivery attempts to continue indefinitely. Failed webhooks retry forever (up to PHP's job retry limit), consuming queue capacity and database storage for permanently dead endpoints.

### Why It Happens
- Not knowing `retry_until` exists
- Assuming job `$tries` is sufficient (it limits retries but doesn't cap the time window)
- Relying solely on Laravel's default retry mechanism
- Not considering that some endpoints become permanently unavailable
- "We'll stop retrying when the job runs out of tries" — which may take weeks

### Warning Signs
- Webhook profile omits `getRetryUntil()` method
- No `retry_until` timestamp set on webhook calls
- Webhooks for deactivated endpoints continue retrying for days/weeks
- `failed_jobs` table fills with webhook failure records
- Queue capacity consumed by zombie webhook retries

### Why Harmful
A partner goes out of business and takes down their webhook endpoint — the system retries their webhooks forever. With exponential backoff, the delays eventually reach hours, but the system never stops. Years later, the failed_jobs table has millions of records for a partner that no longer exists. Worker capacity is permanently consumed by these zombie retries, and the database storage grows unbounded.

### Consequences
- Indefinite retries for permanently dead endpoints
- Queue capacity permanently consumed by zombie webhook retries
- Database storage grows unbounded (webhook_calls table)
- Failed job monitoring is polluted with noise (can't distinguish "permanent failure" from "temporary glitch")
- No way to automatically retire dead endpoints
- Manual cleanup required: find and mark dead endpoints

### Alternative
- Always set `retry_until` on every webhook profile:
  ```php
  class OrderWebhookProfile implements WebhookProfile
  {
      public function getRetryUntil(): Carbon
      {
          return now()->addHours(24); // Stop retrying after 24 hours
      }
  }
  ```
- Align `retry_until` with business SLA:
  - Non-critical: 1-4 hours
  - Standard: 24 hours
  - Critical: 48-72 hours
- Also set `$tries` on the job as a secondary limit

### Refactoring Strategy
1. Audit all webhook profiles — check for `getRetryUntil()` implementation
2. Add `retry_until` to profiles that lack it
3. Set the deadline based on delivery SLA (not arbitrarily)
4. Implement post-deadline handling: dead-letter queue, alert, or webhook profile deactivation
5. Monitor webhook retry window — verify retries stop after deadline

### Detection Checklist
- [ ] Every webhook profile implements `getRetryUntil()`
- [ ] `retry_until` deadline aligns with business SLA
- [ ] Retries stop after deadline (verified in monitoring)
- [ ] Post-deadline handling implemented (alert, dead-letter, deactivation)
- [ ] No zombie webhook retries for permanently dead endpoints

### Related Rules
- set-max-attempts-not-infinite

### Related Skills
- Implement Exponential Backoff for Webhook Delivery

### Related Decision Trees
- Webhook Retry Count Selection

---

## 4. Hardcoded Backoff Array in Job Class

### Category
Architecture

### Description
Baking the backoff delay array directly into the `ProcessWebhookJob` class. Backoff values cannot vary by endpoint — all webhook deliveries use the same retry schedule regardless of the target system's reliability or rate limits.

### Why It Happens
- Starting with a single webhook endpoint and hardcoding the backoff
- Not anticipating multiple endpoints with different requirements
- Not extracting backoff configuration into the webhook profile
- Copying backoff array from documentation without parameterizing it
- "One size fits all" approach to retry timing

### Warning Signs
- `backoff()` method in `ProcessWebhookJob` returns a fixed array
- No per-endpoint backoff configuration exists
- Different endpoints (Stripe API vs small SaaS) share identical retry schedules
- Adding a new endpoint doesn't consider whether the backoff is appropriate
- "We tuned the backoff for Stripe" — used for all webhooks

### Why Harmful
The backoff is tuned for Stripe's API (resilient, well-documented rate limits). A small SaaS endpoint with aggressive rate limiting uses the same backoff — it retries every 10s, 20s, 40s... but the SaaS endpoint has a 60-second rate limit window. Every retry hits the rate limit, wasting resources. The backoff that works for one endpoint is actively harmful for another, but there's no way to customize it without modifying the job class.

### Consequences
- Per-endpoint tuning is impossible without code changes
- Rate limit violations from backoff schedules that don't match endpoint limits
- Wasted retry attempts on mismatched schedules
- Code churn: every new endpoint requires modifying the job class
- Backoff values are trade-offs that satisfy no endpoint perfectly

### Alternative
- Store backoff parameters in the webhook profile:
  ```php
  class OrderWebhookProfile implements WebhookProfile
  {
      public function getBackoff(): array
      {
          return [10, 20, 40, 80, 160, 300]; // Per-endpoint customization
      }
  }
  
  class ProcessWebhookJob implements ShouldQueue
  {
      public function backoff(): array
      {
          return $this->webhookCall->profile->getBackoff();
      }
  }
  ```
- Or store base delay, multiplier, max delay, and jitter in the profile
- Default to sensible values if the profile doesn't specify

### Refactoring Strategy
1. Audit backoff configuration — is it hardcoded in the job class?
2. If yes, extract backoff parameters to the webhook profile
3. Implement per-endpoint backoff customization
4. Set sensible defaults for profiles that don't specify backoff
5. Add monitoring: track retry patterns per endpoint

### Detection Checklist
- [ ] Backoff parameters are configurable per endpoint
- [ ] No hardcoded backoff array in job class
- [ ] Webhook profile provides backoff configuration
- [ ] Different endpoints can have different retry schedules
- [ ] Default backoff exists for profiles without custom config

### Related Rules
- implement-exponential-backoff-with-jitter

### Related Skills
- Implement Exponential Backoff for Webhook Delivery

### Related Decision Trees
- Webhook Retry Count Selection

---

## 5. Retrying 4xx Errors (Except Rate Limits)

### Category
Operations

### Description
Treating all HTTP error responses as retryable, including 4xx client errors (400, 401, 403, 404, 422). These responses indicate the request itself is wrong — retrying with the same payload will produce the same error.

### Why It Happens
- Implementing `if ($response->failed()) { retry(); }` without checking status code
- Not distinguishing between server errors (5xx — retryable) and client errors (4xx — not retryable)
- Assuming all errors are transient
- Not reading HTTP semantics: 4xx means "you sent a bad request"
- "We'll retry and maybe it'll work the second time" — hopeful but incorrect

### Warning Signs
- Webhooks failing with 400, 401, 403, 404 are retried multiple times
- Retry history shows the same 4xx error on every attempt
- Exhausted retries for a webhook that was misconfigured from the start
- "We wasted 10 retries for a 404" — the URL was always wrong
- Failed_jobs table filled with retries for permanently failing requests

### Why Harmful
A webhook URL is misconfigured (typo in the endpoint) — every dispatch returns 404. The system retries 10 times with backoff over 2 hours before giving up, wasting resources that should process valid webhooks. The 404 will never become a 200 without changing the URL. All 10 retries are wasted queue capacity, database writes, and processing time. The real fix (correct the URL) is delayed by retries.

### Consequences
- Queue capacity wasted on doomed retries
- Delayed detection of misconfiguration (2+ hours while retries drain)
- Failed_jobs table polluted with retries that never had a chance
- Monitoring noise: "10 failed webhook attempts" — all for the same misconfiguration
- Delayed notification to ops: the endpoint is wrong, but the system keeps retrying
- Downstream system may block the sender for sending invalid requests

### Alternative
- Classify HTTP responses:
  ```php
  if ($response->failed()) {
      $status = $response->status();
      if ($status >= 400 && $status < 500 && $status !== 429 && $status !== 408) {
          // Client error (except rate limit and timeout) — never retry
          $this->fail("Non-retryable HTTP {$status}: {$response->body()}");
          return;
      }
      // Server error (5xx) or rate limit/timeout — retryable
      $this->release($this->backoff()[$this->attempts()] ?? 300);
  }
  ```
- Log 4xx failures immediately as misconfiguration alerts
- Send notification on first 4xx: "webhook endpoint may be misconfigured"

### Refactoring Strategy
1. Audit webhook HTTP response handling for status code classification
2. Implement status code differentiation: 4xx (non-retryable), 5xx (retryable), 429/408 (retryable with backoff)
3. Add immediate alerting for 4xx responses (misconfiguration signal)
4. Test: send a webhook to a 404 URL — verify zero retries
5. Monitor: 4xx rate should be near-zero (configuration errors caught immediately)

### Detection Checklist
- [ ] 4xx errors (except 429, 408) are NOT retried
- [ ] HTTP response classification implemented (4xx vs 5xx)
- [ ] 4xx failures logged and alerted immediately
- [ ] Configuration errors detected within minutes, not hours
- [ ] Failed_jobs table not polluted with doomed 4xx retries
- [ ] Monitor: 4xx rate is near-zero

### Related Rules
- classify-4xx-not-retryable

### Related Skills
- Implement Exponential Backoff for Webhook Delivery

### Related Decision Trees
- Fixed vs Exponential Backoff for Webhook Retries
