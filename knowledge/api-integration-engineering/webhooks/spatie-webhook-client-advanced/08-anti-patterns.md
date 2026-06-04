# Anti-Patterns — Spatie laravel-webhook-client Configuration and Customization

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Spatie laravel-webhook-client Configuration and Customization |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Monolithic Provider Configuration
2. Generic ProcessWebhookJob Router
3. Unbounded WebhookCall Table Growth
4. Default Validator for All Providers
5. Orphaned Webhook Processing

---

## 1. Monolithic Provider Configuration

### Category
Code Organization

### Description
Creating a single `WebhookConfig` entry that tries to serve multiple webhook providers through shared configuration, losing per-provider isolation and customization.

### Why It Happens
A single config entry is simpler during initial development when only one provider exists. As more providers are added, the single config is extended with shared secrets or generic settings. The cost of splitting into per-provider configs seems higher than the incremental complexity of adding to the existing config.

### Warning Signs
- Single entry in `config/webhook-client.php` for multiple providers
- Shared `signing_secret` across different providers
- Generic `signature_header_name` that doesn't match any provider's actual header
- One `process_webhook_job` class for all providers

### Why Harmful
Each provider has unique requirements: different signing secrets, signature header names, validation algorithms, and processing jobs. A shared config forces all providers through the same pipeline, making it impossible to customize per provider. A security incident (secret leak) affects all providers simultaneously. A processing bug in one provider's job affects all providers.

### Consequences
- Cannot customize signature validation per provider
- Shared signing secret — one leak compromises all integrations
- Configuration error affects all providers
- Adding a provider requires changing shared infrastructure

### Alternative
Create one `WebhookConfig` entry per provider in `config/webhook-client.php` with provider-specific secrets, validators, profiles, and processing jobs.

### Refactoring Strategy
1. Identify each provider's configuration in the single shared config
2. Create dedicated `WebhookConfig` entries per provider
3. Move provider-specific secrets to separate environment variables
4. Assign provider-specific `signature_validator`, `webhook_profile`, and `process_webhook_job`
5. Test each provider independently after separation

### Detection Checklist
- [ ] Separate `WebhookConfig` entry per provider
- [ ] Provider-specific signing secrets in separate env vars
- [ ] Unique `process_webhook_job` per provider
- [ ] Per-provider signature validator configured

### Related Rules
Define One WebhookConfig Entry Per Provider

### Related Skills
Use Spatie Webhook Client for Structured Incoming Webhooks

### Related Decision Trees
Provider Configuration Strategy (Single vs Per-Provider Config)

---

## 2. Generic ProcessWebhookJob Router

### Category
Code Organization

### Description
Creating a single `ProcessWebhookJob` that handles all providers through provider-name routing or event-type dispatching, violating the Single Responsibility Principle.

### Why It Happens
A single `ProcessWebhookJob` is the default approach in Spatie's documentation. The job receives the `WebhookCall` and determines what to do based on the provider name. This seems efficient — one job to rule them all. As business logic grows, the job becomes a switch statement with provider-specific branches.

### Warning Signs
- Single `ProcessWebhookJob` class for all providers
- Job `handle()` contains `match ($webhookCall->name)` or similar routing
- Adding a new provider requires modifying the existing job
- Provider-specific logic mixed in a single handle method

### Why Harmful
A single job class violates Open/Closed principle — adding a provider requires modifying existing code. The job's complexity grows linearly with each provider. Provider-specific retry/backoff settings cannot be customized independently (they're class-level properties). A bug in Stripe's code path may affect GitHub's processing through shared state or control flow.

### Consequences
- Adding providers requires modifying and retesting existing code
- Cannot tune retry/backoff per provider
- Cross-provider coupling — bug in one affects all
- Tests become complex and interdependent

### Alternative
Create a dedicated `ProcessWebhookJob` class per provider, each with its own retry configuration and processing logic.

### Refactoring Strategy
1. Extract each provider's processing logic from the generic job into dedicated job classes
2. Configure `$tries`, `$backoff`, and middleware per job class
3. Update `WebhookConfig` entries to reference the provider-specific job
4. Remove provider routing from the old generic job
5. Test each job independently

### Detection Checklist
- [ ] Dedicated `ProcessWebhookJob` per provider
- [ ] No provider routing logic in job `handle()` method
- [ ] Per-provider retry/backoff configuration
- [ ] Adding a provider requires new job class only

### Related Rules
Create a Unique ProcessWebhookJob Per Provider

### Related Skills
Use Spatie Webhook Client for Structured Incoming Webhooks

### Related Decision Trees
Processing Job Organization (Generic vs Per-Provider Jobs)

---

## 3. Unbounded WebhookCall Table Growth

### Category
Maintainability

### Description
Not setting `delete_after_days` in the webhook client configuration, allowing the `webhook_calls` table to grow indefinitely with stored payloads and headers.

### Why It Happens
The `delete_after_days` config option is easy to miss during setup. The default value (null) means no automatic cleanup. The table grows slowly at first and performance impact is gradual. The problem is only noticed when the table reaches millions of rows and cleanup queries become expensive.

### Warning Signs
- `delete_after_days` not set or set to `null` in `config/webhook-client.php`
- `webhook_calls` table size grows monotonically
- Database page cache hit ratio decreases for webhook_calls queries
- Backup times increase significantly

### Why Harmful
Each webhook stores the full raw payload, headers, and metadata. A high-volume provider sending 10,000 webhooks per day adds 300,000 records per month. After a year, the table has 3.6M+ records. Queries become slow, backups take longer, and most data has no value beyond the first few days for debugging.

### Consequences
- Database performance degradation over time
- Increased storage costs
- Longer backup and restore times
- Slow admin queries on webhook_calls table

### Alternative
Set `delete_after_days` to a finite value (30 days default) to automatically prune old records.

### Refactoring Strategy
1. Set `'delete_after_days' => 30` in `config/webhook-client.php`
2. Run Spatie's cleanup command or wait for automatic cleanup
3. For compliance requirements, archive records to cold storage before deletion
4. Monitor table size over the next month to verify cleanup
5. Adjust retention period based on debugging needs and compliance requirements

### Detection Checklist
- [ ] `delete_after_days` set to finite value
- [ ] Webhook_calls table size stabilizes
- [ ] Old records automatically pruned
- [ ] Compliance requirements satisfied with archive strategy if needed

### Related Rules
Configure delete_after_days to Control Database Growth

### Related Skills
Use Spatie Webhook Client for Structured Incoming Webhooks

### Related Decision Trees
Provider Configuration Strategy (Single vs Per-Provider Config)

---

## 4. Default Validator for All Providers

### Category
Security

### Description
Using Spatie's `DefaultSignatureValidator` for all webhook providers regardless of their signing scheme, silently accepting or rejecting webhooks from providers with non-standard signature formats.

### Why It Happens
The default validator works for standard HMAC-SHA256 raw-body signing, which covers many providers. Developers apply it universally without checking each provider's documentation. The signature verification appears to work because error messages are generic (403 responses) and the failure is attributed to other causes.

### Warning Signs
- Same `signature_validator` class (`DefaultSignatureValidator`) configured for all providers
- Provider webhooks consistently fail verification despite correct secret
- No custom validator classes exist in the codebase
- Verification failure logs show generic errors without provider-specific context

### Why Harmful
Stripe uses a timestamp-prefixed format (`t=timestamp,v1=signature`), GitHub uses `sha256=` prefix, Slack uses `v0=`. The default validator expects a simple HMAC hex string and fails to parse these formats correctly. It either rejects valid webhooks (false negative) or accepts invalid ones (false positive). In either case, the security guarantee is broken.

### Consequences
- Legitimate webhooks from non-standard providers rejected
- (Potentially) forged webhooks accepted from non-standard providers
- False confidence in signature verification
- Debugging time wasted on "wrong secret" when the actual issue is wrong validator

### Alternative
Configure a provider-specific `SignatureValidator` for each provider with a non-standard signing scheme. Use the default validator only for standard HMAC providers.

### Refactoring Strategy
1. Review each provider's signature documentation to understand their scheme
2. Create custom validator classes for non-standard providers
3. Configure `signature_validator` per provider in `config/webhook-client.php`
4. Test each provider with known-good test vectors
5. Keep default validator for providers using standard HMAC

### Detection Checklist
- [ ] Provider-specific signature validator configured per provider
- [ ] Default validator used only for standard HMAC providers
- [ ] Custom validators handle provider-specific formats correctly
- [ ] Each provider tested with official test vectors

### Related Rules
Implement Provider-Specific SignatureValidator

### Related Skills
Use Spatie Webhook Client for Structured Incoming Webhooks

### Related Decision Trees
Provider Configuration Strategy (Single vs Per-Provider Config)

---

## 5. Orphaned Webhook Processing

### Category
Reliability

### Description
Configuring webhook receiving without setting a `process_webhook_job`, causing webhooks to be validated and stored but never actually processed by business logic.

### Why It Happens
The `process_webhook_job` config key is optional in some package versions. A developer configures the signing secret, validator, and profile but forgets to specify the processing job. Webhooks are received, stored in the database, and acknowledged with 200 responses — but the business logic never runs. The integration appears functional because the HTTP endpoint responds successfully.

### Warning Signs
- `process_webhook_job` key missing from `WebhookConfig`
- Webhook_calls records accumulating with `status = 'pending'`
- No webhook-triggered business logic effects (no charges, no notifications)
- HTTP endpoint returns 200 but expected side effects don't occur

### Why Harmful
The webhook receiving pipeline is only half implemented: validation and storage work correctly, but the processing job that triggers business logic never runs. This is particularly dangerous because monitoring shows successful webhook receipts — the dashboard looks healthy. The gap between receipt and processing is invisible without explicit processing monitoring.

### Consequences
- All webhook events stored but never processed
- Business logic never triggered by webhook events
- False sense of security from successful HTTP responses
- Event loss continues until someone notices missing side effects

### Alternative
Always configure a `process_webhook_job` class in every `WebhookConfig` entry that performs the actual business logic processing.

### Refactoring Strategy
1. Add `'process_webhook_job' => App\Jobs\ProcessProviderWebhook::class` to each config entry
2. Create the processing job class if it doesn't exist
3. Verify that stored webhooks trigger the job after configuration
4. Set up monitoring to alert on webhooks with no associated job processing
5. Add validation in CI/CD that all config entries have process_webhook_job set

### Detection Checklist
- [ ] `process_webhook_job` set in every `WebhookConfig` entry
- [ ] Processing job exists and handles business logic
- [ ] Webhook receipts result in job processing
- [ ] Monitoring alerts on webhooks without processing

### Related Rules
Define One WebhookConfig Entry Per Provider

### Related Skills
Use Spatie Webhook Client for Structured Incoming Webhooks

### Related Decision Trees
Processing Model (Synchronous vs Queue-First)
