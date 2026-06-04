# Skill: Queue Incoming Webhook Processing for Async Handling

## Purpose
Dispatch incoming webhook business logic to Laravel jobs for asynchronous processing, ensuring fast HTTP responses and decoupling receipt from execution.

## When To Use
- All production webhook endpoints
- Webhooks triggering slow operations (database writes, external API calls)
- Rate-limiting webhook processing throughput

## When NOT To Use
- Synchronous-only processing requirements
- Prototype without queue infrastructure

## Prerequisites
- Queue driver configured (Redis, SQS, database)
- Laravel queue workers running

## Workflow
1. Validate webhook signature synchronously in controller
2. Dispatch job with webhook payload data
3. Do not pass Eloquent models or Request objects to jobs
4. Handle job failures: `$this->release($delay)` for retry, `fail()` for permanent
5. Use unique job keys to prevent duplicate processing
6. Set appropriate `$tries` and `$backoff` on job class
7. Return HTTP 200 immediately after validation and dispatch
8. Test async processing end-to-end

## Validation Checklist
- [ ] Signature validated before dispatching
- [ ] Job dispatched with payload data (not request/model)
- [ ] Job failure handled: release or fail
- [ ] Unique job keys prevent duplicate processing
- [ ] Retry/backoff configured for transient failures
- [ ] HTTP 200 returned promptly
- [ ] End-to-end test: receipt + processing
