# ECC Anti-Patterns — Spatie Laravel Webhook Client Package

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Spatie Laravel Webhook Client Package |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Single Profile Class for All Providers
2. Signing Secrets Hardcoded in Config
3. No Queue Connection Configured (Sync Processing)
4. Deleting WebhookCall After Processing (No Audit Trail)
5. No Failure Monitoring on Webhook Processing
6. Outdated Package Version (Unpatched Vulnerabilities)

## Repository-Wide Anti-Patterns

- God Services
- Hidden Configuration
- Silent Failure

---

## Anti-Pattern 1: Single Profile Class for All Providers

### Category
Code Organization | Maintainability

### Description
Using one `WebhookProfile` class that accepts all events from all providers. No per-provider event filtering.

### Why It Happens
The profile class works out of the box. Creating per-provider profiles seems like unnecessary abstraction.

### Warning Signs
- Single profile class with `return true` in `shouldProcess()`
- All providers use the same profile class
- No event-type filtering by provider

### Why It Is Harmful
Irrelevant events from one provider trigger job dispatch. A Stripe `ping` event dispatches a job that crashes because it expects a `charge` event. The failure causes unnecessary noise in monitoring. Cannot customize acceptance logic per provider.

### Preferred Alternative
One profile class per provider with provider-specific event filtering.

### Refactoring Strategy
1. Create per-provider profile classes in `Webhooks/Profiles/`
2. Implement `shouldProcess()` to filter relevant event types
3. Update `webhook-client.php` config with per-provider profiles

### Related Rules
Define One Profile Class Per External Provider (05-rules.md)

### Related Skills
Receive Incoming Webhooks with Spatie Laravel Webhook Client (06-skills.md)

### Related Decision Trees
Profile Class Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Signing Secrets Hardcoded in Config

### Category
Security | Compliance

### Description
Embedding signing secrets directly in `config/webhook-client.php` instead of using environment variables.

### Why It Happens
Copy-paste from provider dashboard directly into config file. It works immediately.

### Warning Signs
- String literals like `'whsec_abc123'` in config file
- Secrets visible in version control history

### Why It Is Harmful
Secrets committed to git are accessible to every developer with repo access. Secret rotation requires a code change and deployment. If the repo is compromised (leaked, former employee), all webhook secrets are exposed.

### Preferred Alternative
Load secrets from `.env` via `env()` in config.

### Refactoring Strategy
1. Replace hardcoded secrets with `env('STRIPE_WEBHOOK_SECRET')`
2. Add secrets to `.env` file
3. Remove secrets from git history (BFG Repo-Cleaner)
4. Rotate secrets after migration

### Related Rules
Store Signing Secrets in Environment Configuration, Not Code (05-rules.md)

---

## Anti-Pattern 3: No Queue Connection Configured (Sync Processing)

### Category
Performance | Reliability

### Description
Not setting `queue_connection` in webhook config. `ProcessWebhookJob` runs synchronously in the HTTP request.

### Why It Happens
The default behavior processes synchronously. Developers don't read the config docs about `queue_connection`.

### Warning Signs
- No `queue_connection` key in webhook config
- Webhook HTTP response time equals processing time
- Job failures in webhook lifecycle don't retry

### Why It Is Harmful
Synchronous processing blocks the HTTP response until all business logic completes (DB writes, API calls, email). Provider timeout (5-30s) triggers retry. PHP workers exhausted on slow processing. No job retry on failure.

### Preferred Alternative
Configure `queue_connection` in each webhook config.

### Refactoring Strategy
1. Add `'queue_connection' => env('QUEUE_CONNECTION', 'redis')` to config
2. Verify queue worker is running for webhook queue
3. Remove any synchronous processing fallbacks

### Related Rules
Configure Queue Connection for Async Processing (05-rules.md)

---

## Anti-Pattern 4: Deleting WebhookCall After Processing (No Audit Trail)

### Category
Maintainability | Observability

### Description
Deleting the `WebhookCall` record after successful processing instead of retaining it for audit purposes.

### Why It Happens
Storage concerns: "Why keep records we don't need?" Developers don't anticipate debugging needs.

### Warning Signs
- `$call->delete()` in processing job
- `WebhookCall` table always empty or very small
- Can't trace what webhooks were processed yesterday

### Why It Is Harmful
When a user reports a bug ("my charge was applied twice"), there's no record of what webhooks were received. Debugging requires adding logging and waiting for the next event. Compliance audits (PCI, SOC2) require webhook delivery records.

### Preferred Alternative
Update status on WebhookCall, do not delete.

### Refactoring Strategy
1. Remove `$call->delete()` from processing jobs
2. Update status to `processed` or `failed` instead
3. Schedule cleanup for records older than retention period
4. Add admin UI for viewing WebhookCall history

### Related Rules
Leverage Webhook Model for Audit and Replay (05-rules.md)

---

## Anti-Pattern 5: No Failure Monitoring on Webhook Processing

### Category
Observability | Reliability

### Description
No logging, metrics, or alerting on webhook processing failures. Failures are silent.

### Why It Happens
Developers assume the queue's failed job table is sufficient.

### Warning Signs
- No `failed()` method on webhook jobs
- No event listeners for `JobFailed`
- No metrics on processing failure rate

### Why It Is Harmful
A provider changes their event format. All webhook processing jobs start failing. The queue moves jobs to the `failed_jobs` table. No one checks the table. Days later, a customer complains about missing functionality. The failure was silent and cumulative.

### Preferred Alternative
Implement `failed()` method and failure alerting on webhook jobs.

### Refactoring Strategy
1. Add `failed()` method to webhook jobs
2. Log failure details and increment metrics
3. Send notification on failure rate spike
4. Monitor failed_jobs table regularly

### Related Rules
Monitor Failed Webhook Processing (05-rules.md)

---

## Anti-Pattern 6: Outdated Package Version (Unpatched Vulnerabilities)

### Category
Security | Maintainability

### Description
Running an old version of `spatie/laravel-webhook-client` with known security vulnerabilities.

### Why It Happens
"It works, don't touch it." Package updates are seen as risk rather than security maintenance.

### Warning Signs
- `composer show spatie/laravel-webhook-client` shows outdated version
- No update in `composer.json` for >6 months
- No dependency review in CI pipeline

### Why It Is Harmful
Webhook handling packages deal with cryptographic verification and request parsing. Unpatched vulnerabilities in signature validation or request handling expose webhook endpoints to forgery, replay, or denial-of-service.

### Preferred Alternative
Regularly update the package and monitor security advisories.

### Refactoring Strategy
1. Check current version with `composer show spatie/laravel-webhook-client`
2. Update to latest minor: `composer update spatie/laravel-webhook-client`
3. Test with breaking changes (changelog review)
4. Add Dependabot or similar for automated PRs

### Related Rules
Keep Package Updated for Security Patches (05-rules.md)
