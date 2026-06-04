# Skill: Process Webhooks Asynchronously via Laravel Queues

## Purpose
Dispatch webhook handling to Laravel jobs for async processing, preventing webhook timeouts and decoupling receipt from business logic.

## When To Use
- Any webhook endpoint in production
- Webhook processing that is time-consuming or I/O-heavy
- Rate-limiting webhook processing to avoid overload
- Ensuring webhook HTTP responses are fast (< 5 seconds)

## When NOT To Use
- Webhook processing that must happen synchronously before responding
- Prototype/staging where queue infrastructure isn't available

## Prerequisites
- Queue driver configured (Redis, SQS, database)
- Laravel queue worker running

## Workflow
1. Create a job class for each webhook event type
2. In controller: validate signature, dispatch job, return 200
3. Pass webhook payload as event or data DTO (not request instance)
4. Handle job failures: `$this->release($delay)` for transient failures
5. Set unique job keys to prevent duplicate processing
6. Configure retry count and backoff for job retries
7. Log job dispatch and completion for monitoring
8. Test webhook receipt and async processing end-to-end

## Validation Checklist
- [ ] Webhook controller validates and dispatches only
- [ ] Job class handles business logic
- [ ] Payload passed as data, not request instance
- [ ] Job failures handled with release or fail
- [ ] Unique job keys prevent duplicates
- [ ] Retry/backoff configured for transient failures
- [ ] End-to-end test: webhook received, job processed
