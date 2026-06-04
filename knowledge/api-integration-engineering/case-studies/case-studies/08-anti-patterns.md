# ECC Anti-Patterns — Real-World Integration Case Studies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 10-case-studies |
| **Knowledge Unit** | Real-World Integration Case Studies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. All-in-One Webhook Endpoint — Single Endpoint Processing All Provider Events
2. No Dead-Letter Queue — Failed Webhook Events Lost Permanently
3. Synchronous Webhook Processing — Blocking HTTP 200 Response
4. Shared Circuit Breaker Across All Providers
5. Storing OAuth2 Tokens in Plaintext
6. No Webhook Deduplication — Duplicate Event Processing
7. Reusing Idempotency Keys Across Different Payloads
8. No Integration Audit Trail

---

## Repository-Wide Anti-Patterns

- Copy-Paste Integration Pattern
- All-Providers-Treated-Equally Fallacy

---

## Anti-Pattern 1: All-in-One Webhook Endpoint — Single Endpoint Processing All Provider Events

### Category
Architecture | Maintainability

### Description
Using a single webhook endpoint URL for all providers, routing events internally by parsing the event type, instead of using one endpoint per provider.

### Why It Happens
Simpler routing setup. Assumption that all webhooks follow the same format. One route registration is easier than per-provider routes.

### Warning Signs
- Single `/api/webhooks` endpoint handling Stripe, GitHub, and custom webhooks
- Route handler has a large if/else or match block per provider
- Adding a new provider requires modifying the shared endpoint
- Signature verification logic varies per provider in the same method

### Why It Is Harmful
Violates separation of concerns. One provider's malformed payload can crash all webhook processing. Adding a provider risks breaking existing ones. Cannot scale webhook processing independently per provider.

### Real-World Consequences
GitHub webhook format change breaks Stripe payment webhook processing. Emergency hotfix required because single endpoint handles both. Stripe retries pile up during the outage, causing duplicate payment events.

### Preferred Alternative
Use one webhook endpoint per provider (`/api/webhooks/stripe`, `/api/webhooks/github`). Each endpoint has its own route, signature validator, and processing pipeline.

### Refactoring Strategy
1. Create per-provider webhook routes with unique URLs
2. Register each URL with the corresponding provider's dashboard
3. Move provider-specific logic (signature validation, event parsing) to provider-dedicated controllers
4. Keep shared utilities (queue dispatch, logging) in a base class or trait
5. Update provider dashboards with new per-provider webhook URLs
6. Deprecate the shared endpoint after all providers migrate

### Detection Checklist
- [ ] Single webhook endpoint URL for multiple providers
- [ ] Route handler contains per-provider branching
- [ ] Signature verification logic mixed for different providers
- [ ] Adding a new provider requires changes to existing endpoint

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)

---

## Anti-Pattern 2: No Dead-Letter Queue — Failed Webhook Events Lost Permanently

### Category
Reliability | Data Integrity

### Description
Not configuring a dead-letter queue for webhook processing failures, causing events that exceed retry limits to be lost permanently.

### Why It Happens
Default queue configuration has no dead-letter setup. Team assumes webhooks always process successfully after retries.

### Warning Signs
- Failed webhook jobs silently discarded after max attempts
- No table or storage mechanism for permanently failed events
- Reconciliation process relies on "hope" that no events were lost
- Manual reprocessing of failed events is impossible

### Why It Is Harmful
Irrecoverable data loss. Cannot reconcile webhook events with upstream provider records. Audit gaps for compliance requirements.

### Real-World Consequences
Stripe payment succeeded but webhook processing failed permanently — order not fulfilled, customer not notified. Lost event cannot be replayed. Manual intervention requires provider dashboard inspection.

### Preferred Alternative
Configure a dead-letter queue (failed_jobs table or dedicated storage) that preserves the full event payload, headers, and failure reason for manual inspection and replay.

### Refactoring Strategy
1. Create a `dead_letter_webhooks` database table with columns for payload, headers, error, provider, and timestamp
2. Create a custom queue failed-job handler or middleware that stores failed webhook events
3. Implement a replay command that retries dead-letter events
4. Add a dashboard or notification for dead-letter monitoring
5. Set up alerting when dead-letter count exceeds threshold

### Detection Checklist
- [ ] No storage for permanently failed webhook events
- [ ] `failed_jobs` table empty or not configured
- [ ] No way to replay a failed webhook event
- [ ] No monitoring or alerting on webhook processing failures

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Synchronous Webhook Processing — Blocking HTTP 200 Response

### Category
Performance | Reliability

### Description
Processing webhook events synchronously in the webhook controller before returning the HTTP 200 response, delaying the acknowledgement.

### Why It Happens
Simpler implementation — process inline, no queue setup. Team assumes webhook processing is fast enough to be synchronous.

### Warning Signs
- Webhook controller calls business logic directly without dispatching a job
- HTTP response time for webhook endpoint exceeds 2 seconds
- Provider webhook dashboard shows high retry rate
- Webhook endpoint response time correlates with processing load

### Why It Is Harmful
Providers timeout and retry, causing duplicate processing. Slow responses degrade the provider's delivery reputation. Controller cannot scale under load.

### Real-World Consequences
Stripe retries webhook delivery because response exceeded 5 seconds — customer charged twice, duplicate event handling. Provider marks endpoint as degraded and reduces delivery priority.

### Preferred Alternative
Acknowledge the webhook immediately with HTTP 200, then dispatch a queue job for processing. Use Spatie's built-in queue-first processing.

### Refactoring Strategy
1. Move webhook processing logic from controller to a queue job class
2. Replace inline processing with `ProcessWebhook::dispatch($event)` in the controller
3. Configure queue worker for webhook processing
4. Add `ShouldBeUnique` to prevent duplicate job processing
5. Test that controller returns 200 within 100ms regardless of processing load

### Detection Checklist
- [ ] Webhook controller processes business logic before returning response
- [ ] HTTP response time exceeds 1 second for webhook endpoint
- [ ] Provider shows webhook retries in dashboard
- [ ] No queue job class for webhook processing

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Shared Circuit Breaker Across All Providers

### Category
Resilience | Fault Isolation

### Description
Using a single circuit breaker instance for all external API providers, so one provider's failure blocks calls to all other providers.

### Why It Happens
Single circuit breaker is easier to configure. Team doesn't expect per-provider isolation to matter.

### Warning Signs
- One circuit breaker key/name used for all API calls
- Stripe outage causes GitHub API calls to fail
- Circuit breaker state is global, not per-provider
- Different providers have different failure thresholds but use same breaker

### Why It Is Harmful
Cascading failures — one provider's outage takes down all integrations. False positives — a healthy provider is blocked because an unrelated provider failed.

### Real-World Consequences
GitHub API outage causes payment processing to fail because Stripe shares the same circuit breaker. E-commerce site stops accepting payments during a GitHub incident.

### Preferred Alternative
Create one circuit breaker instance per provider service. Each provider has independent failure thresholds, recovery timing, and state monitoring.

### Refactoring Strategy
1. Identify all external API providers in the codebase
2. Create per-provider circuit breaker instances with unique keys (`circuit.stripe`, `circuit.github`)
3. Configure per-provider thresholds based on provider reliability
4. Update all API call sites to use provider-specific circuit breaker
5. Add per-provider monitoring dashboards

### Detection Checklist
- [ ] Single circuit breaker key used for all external API calls
- [ ] One provider's outage blocks calls to other providers
- [ ] Circuit breaker state not namespaced by provider
- [ ] Different providers have same failure threshold

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Circuit Breaker Package Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Storing OAuth2 Tokens in Plaintext

### Category
Security | Compliance

### Description
Storing OAuth2 access tokens, refresh tokens, or API credentials in plaintext in the database, exposed to any data breach or SQL injection.

### Why It Happens
Team prioritizing convenience over security. Assumption that database access is sufficiently restricted.

### Warning Signs
- Credential column is `VARCHAR` not `TEXT` with encryption
- Database dump reveals plaintext tokens
- No encryption/decryption logic around credential storage
- Credentials visible in admin panels or query logs

### Why It Is Harmful
Data breach exposes all integration credentials. Attacker with SQL injection can extract tokens to impersonate users or services. Compliance violations (GDPR, HIPAA, PCI).

### Real-World Consequences
Database dump on GitHub exposes all OAuth2 tokens — every integration must be re-authorized. PCI audit fails due to plaintext credential storage. Customer notification required.

### Preferred Alternative
Encrypt all OAuth2 tokens at rest using Laravel's `encrypt()` / `Crypt::encrypt()`. Decrypt only when making API calls in the current request context.

### Refactoring Strategy
1. Add encrypted column for credentials using Laravel's encrypted casting
2. Create a migration: add `encrypted_credentials` column
3. Write migration to encrypt existing plaintext credentials
4. Update all credential read sites to decrypt before use
5. Remove plaintext credential column after migration
6. Verify no plaintext credential leaks in logs or backups

### Detection Checklist
- [ ] OAuth2 tokens stored in plaintext column
- [ ] No `EncryptedCast` or `encrypt()` used on credential columns
- [ ] Database dump reveals plaintext API keys or tokens
- [ ] Logs contain credential values

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)

---

## Anti-Pattern 6: No Webhook Deduplication — Duplicate Event Processing

### Category
Reliability | Data Integrity

### Description
Not deduplicating webhook events by provider delivery ID, causing duplicate processing when providers retry delivery.

### Why It Happens
Teams assume each webhook delivery is unique. Provider retry behavior is not accounted for in webhook handler design.

### Warning Signs
- Webhook handler doesn't check for duplicate delivery IDs
- Duplicate order fulfillment, payment confirmation, or notification events
- Provider dashboard shows retries but handler has no idempotency
- Support tickets about duplicate charges or double notifications

### Why It Is Harmful
Duplicate charges, double order fulfillment, duplicate notifications. Data integrity violations. Customer trust degradation.

### Real-World Consequences
Stripe retries a webhook due to temporary network issue — customer charged twice. Two order fulfillment jobs dispatched. Customer support handles refund request and trust is damaged.

### Preferred Alternative
Store provider delivery IDs with a unique constraint. Check for existing delivery ID before processing. Use `firstOrCreate` or database unique index.

### Refactoring Strategy
1. Add a `webhook_events` table with `delivery_id` (unique) and `provider` columns
2. Create a unique index on `(provider, delivery_id)`
3. In the webhook handler, attempt to insert the delivery ID first
4. If duplicate, acknowledge and skip processing
5. Store the full event payload for audit purposes
6. Test with duplicate delivery IDs

### Detection Checklist
- [ ] Webhook handler doesn't check for existing delivery ID
- [ ] No `webhook_events` deduplication table
- [ ] Duplicate processing observed in production
- [ ] Provider dashboard shows webhook retries

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)

---

## Anti-Pattern 7: Reusing Idempotency Keys Across Different Payloads

### Category
Data Integrity | Reliability

### Description
Reusing the same idempotency key for different API request payloads, causing 409 Conflict errors or incorrect deduplication.

### Why It Happens
Idempotency key generation is not deterministic based on request content. Team reuses keys across retries of different operations.

### Warning Signs
- Same idempotency key sent with different request bodies
- Provider returns 409 Conflict on legitimate new requests
- Idempotency key is a static string or user ID instead of a hash of the request
- Key generation doesn't include a unique operation identifier

### Why It Is Harmful
Provider rejects valid requests as duplicates. Operations silently not executed because the provider cached a previous response. Data inconsistencies between application and provider state.

### Real-World Consequences
Stripe returns 409 Conflict for a legitimate new payment because the idempotency key was reused with a different amount. Customer not charged, but application thinks payment succeeded. Reconciliation discovers the gap hours later.

### Preferred Alternative
Generate idempotency keys as a deterministic hash of the request method, path, and body content (e.g., `hash('sha256', $method.$path.json_encode($body))`). Never reuse keys across different operations.

### Refactoring Strategy
1. Audit all idempotency key generation code
2. Implement key generation that includes request content hash
3. Ensure each unique operation gets a unique key
4. Add key collision detection in development environment
5. Monitor for 409 responses in production logging

### Detection Checklist
- [ ] Idempotency key is a static string or reused across operations
- [ ] Key generation doesn't include request body or unique operation ID
- [ ] Provider returns 409 Conflict responses
- [ ] Application assumes idempotency key guarantees operation execution

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Circuit Breaker Package Selection (07-decision-trees.md)

---

## Anti-Pattern 8: No Integration Audit Trail

### Category
Observability | Compliance

### Description
Not logging integration events (request, response, status, timing) with enough context to reconstruct what happened during an incident.

### Why It Happens
Logging is not prioritized during integration development. Teams assume errors will be obvious when they occur.

### Warning Signs
- Support cannot determine what API calls were made during an incident
- No record of webhook deliveries, HTTP requests, or circuit breaker state changes
- Debugging integration issues requires adding temporary log statements
- Compliance audits cannot verify integration data flow

### Why It Is Harmful
Incident response is slow — hours of guesswork instead of minutes of log review. Cannot perform post-mortem analysis. Compliance violations for regulated industries.

### Real-World Consequences
Payment reconciliation takes 3 days because webhook delivery logs are incomplete. Compliance audit fails — no record of data processing for regulated integrations. P1 incident diagnosis takes 4 hours because integration logs don't exist.

### Preferred Alternative
Log all integration events with structured context: provider, endpoint, method, status, duration, request ID, and a sanitized summary of request/response. Store in a structured log system or a dedicated integration_audits table.

### Refactoring Strategy
1. Add middleware or event listeners that log integration events
2. Create a structured log format with all relevant context fields
3. Store logs in a queryable system (database, ELK, DataDog)
4. Add correlation ID to link request-side and webhook-side events
5. Build a simple dashboard or log query for incident response
6. Verify log completeness by comparing provider-side stats with application-side logs

### Detection Checklist
- [ ] No structured logging of integration API calls
- [ ] Debugging requires temporary log statements
- [ ] No correlation between outbound API calls and inbound webhook events
- [ ] Compliance audit cannot trace integration data flow
- [ ] Circuit breaker state transitions not logged

### Related Rules
Always verify webhook signatures in production (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)
